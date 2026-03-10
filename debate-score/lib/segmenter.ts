/**
 * Splits a transcript into segments (rounds/exchange blocks).
 * Tries natural breaks first, then falls back to word-count chunks.
 */
export function segmentTranscript(transcript: string): string[] {
  const lines = transcript.split('\n');
  const segments: string[] = [];

  // Detect explicit round markers: "Round 1", "ROUND 2", "--- Round ---"
  const roundMarkerRe = /^[-=\s]*(round|segment|part|section)\s*\d+[-=\s:]*/i;

  // Detect speaker-change patterns common in transcripts: "SPEAKER A:", "John:", "[00:05]"
  const speakerRe = /^(\[?[\d:]+\]?\s*)?[A-Z][A-Z\s]{0,30}:/;

  let currentSegment: string[] = [];
  let segmentCount = 0;

  // First pass: try to split on round markers
  let hasRoundMarkers = lines.some(l => roundMarkerRe.test(l.trim()));

  if (hasRoundMarkers) {
    for (const line of lines) {
      if (roundMarkerRe.test(line.trim()) && currentSegment.length > 0) {
        segments.push(currentSegment.join('\n').trim());
        currentSegment = [line];
        segmentCount++;
      } else {
        currentSegment.push(line);
      }
    }
    if (currentSegment.length > 0) {
      segments.push(currentSegment.join('\n').trim());
    }
    return segments.filter(s => s.length > 100);
  }

  // Second pass: split by exchange blocks (~300-500 words each)
  const TARGET_WORDS = 400;
  const words: string[] = transcript.split(/\s+/);
  const totalWords = words.length;

  if (totalWords <= TARGET_WORDS * 1.5) {
    return [transcript.trim()];
  }

  // Split into roughly equal segments
  const numSegments = Math.max(2, Math.round(totalWords / TARGET_WORDS));
  const wordsPerSegment = Math.ceil(totalWords / numSegments);

  for (let i = 0; i < numSegments; i++) {
    const start = i * wordsPerSegment;
    const end = Math.min(start + wordsPerSegment, totalWords);
    const chunk = words.slice(start, end).join(' ');

    // Try to end on a sentence boundary
    const lastPeriod = Math.max(
      chunk.lastIndexOf('. '),
      chunk.lastIndexOf('! '),
      chunk.lastIndexOf('? ')
    );

    if (lastPeriod > chunk.length * 0.6) {
      segments.push(chunk.slice(0, lastPeriod + 1).trim());
      // Put remainder back into next chunk
      const remainder = chunk.slice(lastPeriod + 2);
      if (remainder && i === numSegments - 1) {
        segments[segments.length - 1] += ' ' + remainder;
      }
    } else {
      segments.push(chunk.trim());
    }
  }

  return segments.filter(s => s.length > 50);
}

/**
 * Extract a rough time reference from segment content if timestamps are present.
 */
export function extractTimestamp(content: string): string | undefined {
  const match = content.match(/\[?([\d]{1,2}:[\d]{2}(?::[\d]{2})?)\]?/);
  return match ? match[1] : undefined;
}
