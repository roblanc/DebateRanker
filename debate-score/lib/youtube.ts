import { YoutubeTranscript } from 'youtube-transcript';

export function extractVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=)([^&\n?#]+)/,
    /(?:youtu\.be\/)([^&\n?#]+)/,
    /(?:youtube\.com\/embed\/)([^&\n?#]+)/,
    /^([a-zA-Z0-9_-]{11})$/,
  ];
  for (const pattern of patterns) {
    const match = url.trim().match(pattern);
    if (match) return match[1];
  }
  return null;
}

export async function fetchYouTubeTranscript(videoId: string): Promise<string> {
  const items = await YoutubeTranscript.fetchTranscript(videoId);

  return items
    .map(item => {
      const totalSecs = Math.floor(item.offset);
      const mins = Math.floor(totalSecs / 60);
      const secs = totalSecs % 60;
      const timestamp = `[${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}]`;
      return `${timestamp} ${item.text}`;
    })
    .join('\n');
}
