import { NextRequest, NextResponse } from 'next/server';
import { extractVideoId } from '@/lib/youtube';

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();
    if (!url) return NextResponse.json({ error: 'url is required' }, { status: 400 });

    const videoId = extractVideoId(url);
    if (!videoId) return NextResponse.json({ error: 'Invalid YouTube URL' }, { status: 400 });

    const canonicalUrl = `https://www.youtube.com/watch?v=${videoId}`;

    // Get video title via oEmbed (no API key needed)
    let title: string | null = null;
    try {
      const r = await fetch(`https://www.youtube.com/oembed?url=${canonicalUrl}&format=json`);
      if (r.ok) title = (await r.json()).title ?? null;
    } catch { /* title stays null */ }

    return NextResponse.json({ videoId, url: canonicalUrl, title });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Failed' }, { status: 500 });
  }
}
