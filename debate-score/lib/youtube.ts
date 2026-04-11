const ANDROID_VERSION = '20.10.38';
const IOS_VERSION = '19.29.1';
const ANDROID_UA = `com.google.android.youtube/${ANDROID_VERSION} (Linux; U; Android 14)`;
const IOS_UA = `com.google.ios.youtube/${IOS_VERSION} (iPhone16,2; U; CPU iOS 17_5_1 like Mac OS X)`;
const WEB_USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
const INNERTUBE_URL = 'https://www.youtube.com/youtubei/v1/player?prettyPrint=false';

export function extractVideoId(url: string): string | null {
  if (url.length === 11 && /^[a-zA-Z0-9_-]+$/.test(url)) return url;
  const match = url.match(/(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?|shorts|live)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/i);
  return match?.[1] ?? null;
}

interface CaptionTrack {
  baseUrl: string;
  languageCode: string;
  kind?: string; // 'asr' = auto-generated
}

function pickBestTrack(tracks: CaptionTrack[]): CaptionTrack {
  // Priority: manual English > auto English > any manual > first available
  return (
    tracks.find(t => t.languageCode === 'en' && t.kind !== 'asr') ??
    tracks.find(t => t.languageCode === 'en') ??
    tracks.find(t => t.kind !== 'asr') ??
    tracks[0]
  );
}

function parseTranscriptXml(xml: string): Array<{ text: string; offset: number }> {
  const results: Array<{ text: string; offset: number }> = [];

  // Newer format: <p t="12345" d="2000"><s>word</s><s> word</s></p>
  const pTagRegex = /<p\s+t="(\d+)"\s+d="(\d+)"[^>]*>([\s\S]*?)<\/p>/g;
  let match;
  while ((match = pTagRegex.exec(xml)) !== null) {
    const offset = parseInt(match[1], 10);
    const inner = match[3];
    let text = '';
    const sTagRegex = /<s[^>]*>([^<]*)<\/s>/g;
    let sMatch;
    while ((sMatch = sTagRegex.exec(inner)) !== null) text += sMatch[1];
    if (!text) text = inner.replace(/<[^>]+>/g, '');
    text = decodeEntities(text).trim();
    if (text) results.push({ text, offset });
  }
  if (results.length > 0) return results;

  // Older format: <text start="1.23" dur="2.00">...</text>
  const textTagRegex = /<text start="([^"]*)" dur="([^"]*)">([^<]*)<\/text>/g;
  while ((match = textTagRegex.exec(xml)) !== null) {
    const offset = Math.floor(parseFloat(match[1]) * 1000);
    const text = decodeEntities(match[3]).trim();
    if (text) results.push({ text, offset });
  }
  return results;
}

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(parseInt(n, 10)));
}

function formatTranscript(items: Array<{ text: string; offset: number }>): string {
  return items.map(({ text, offset }) => {
    const totalSecs = Math.floor(offset / 1000);
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `[${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}] ${text}`;
  }).join('\n');
}

async function fetchTranscriptFromTrack(track: CaptionTrack): Promise<string> {
  const res = await fetch(track.baseUrl, { headers: { 'User-Agent': WEB_USER_AGENT } });
  if (!res.ok) throw new Error(`Caption fetch failed: ${res.status}`);
  const xml = await res.text();
  const items = parseTranscriptXml(xml);
  if (items.length === 0) throw new Error('Transcript is empty');
  return formatTranscript(items);
}

async function tryInnerTubeClient(
  videoId: string,
  clientName: string,
  clientVersion: string,
  userAgent: string,
  extra: Record<string, unknown> = {}
): Promise<string | null> {
  try {
    const res = await fetch(INNERTUBE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'User-Agent': userAgent },
      body: JSON.stringify({
        context: { client: { clientName, clientVersion, ...extra } },
        videoId,
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const tracks: CaptionTrack[] | undefined = data?.captions?.playerCaptionsTracklistRenderer?.captionTracks;
    if (!Array.isArray(tracks) || tracks.length === 0) return null;
    return await fetchTranscriptFromTrack(pickBestTrack(tracks));
  } catch {
    return null;
  }
}

// Strategy 1: InnerTube — try ANDROID then iOS (both bypass bot checks on cloud IPs)
async function fetchViaInnerTube(videoId: string): Promise<string | null> {
  const android = await tryInnerTubeClient(videoId, 'ANDROID', ANDROID_VERSION, ANDROID_UA);
  if (android) return android;

  return tryInnerTubeClient(videoId, 'IOS', IOS_VERSION, IOS_UA, {
    deviceMake: 'Apple',
    deviceModel: 'iPhone16,2',
    osName: 'iPhone',
    osVersion: '17.5.1.21F90',
  });
}

// Strategy 2: Parse ytInitialPlayerResponse from HTML
async function fetchViaHtml(videoId: string): Promise<string> {
  const res = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
    headers: { 'User-Agent': WEB_USER_AGENT, 'Accept-Language': 'en-US,en;q=0.9' },
  });
  if (!res.ok) throw new Error(`YouTube page fetch failed: ${res.status}`);
  const html = await res.text();

  if (html.includes('class="g-recaptcha"')) {
    throw new Error('YouTube is rate limiting this server. Try again later.');
  }

  // Extract ytInitialPlayerResponse using brace-matching (same as the package)
  const marker = 'var ytInitialPlayerResponse = ';
  const start = html.indexOf(marker);
  if (start === -1) throw new Error('Could not parse YouTube page');

  let depth = 0;
  let jsonStr = '';
  for (let i = start + marker.length; i < html.length; i++) {
    if (html[i] === '{') depth++;
    else if (html[i] === '}') depth--;
    jsonStr += html[i];
    if (depth === 0) break;
  }

  let data: Record<string, unknown>;
  try { data = JSON.parse(jsonStr); } catch { throw new Error('Could not parse YouTube page data'); }

  const tracks = (data as Record<string, unknown> & {
    captions?: { playerCaptionsTracklistRenderer?: { captionTracks?: CaptionTrack[] } }
  })?.captions?.playerCaptionsTracklistRenderer?.captionTracks;

  if (!Array.isArray(tracks) || tracks.length === 0) {
    throw new Error('No captions available for this video');
  }

  return await fetchTranscriptFromTrack(pickBestTrack(tracks));
}

export async function fetchYouTubeTranscript(videoId: string): Promise<string> {
  const fromInnerTube = await fetchViaInnerTube(videoId);
  if (fromInnerTube) return fromInnerTube;
  return fetchViaHtml(videoId);
}
