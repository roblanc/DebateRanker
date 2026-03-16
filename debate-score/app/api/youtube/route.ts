import { NextRequest, NextResponse } from 'next/server';
import { extractVideoId, fetchYouTubeTranscript } from '@/lib/youtube';

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();

    if (!url) {
      return NextResponse.json({ error: 'url is required' }, { status: 400 });
    }

    const videoId = extractVideoId(url);
    if (!videoId) {
      return NextResponse.json({ error: 'Could not extract video ID from URL' }, { status: 400 });
    }

    const transcript = await fetchYouTubeTranscript(videoId);

    return NextResponse.json({ transcript, videoId });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch transcript';
    // youtube-transcript throws if captions are disabled or video doesn't exist
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
