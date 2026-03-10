import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { Debate, Segment, Score, Moment, ArgumentNode, ArgumentEdge, DebateWithDetails } from '@/types';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = getDb();

    const debate = db.prepare('SELECT * FROM debates WHERE id = ?').get(id) as Debate | undefined;
    if (!debate) {
      return NextResponse.json({ error: 'Debate not found' }, { status: 404 });
    }

    const segments = db.prepare(
      'SELECT * FROM segments WHERE debate_id = ? ORDER BY round_number ASC'
    ).all(id) as Segment[];

    const segmentsWithScores = segments.map(seg => {
      const scores = db.prepare('SELECT * FROM scores WHERE segment_id = ?').all(seg.id) as Score[];
      const moments = db.prepare('SELECT * FROM moments WHERE segment_id = ?').all(seg.id) as Moment[];
      return { ...seg, scores, moments };
    });

    const argument_nodes = db.prepare(
      'SELECT * FROM argument_nodes WHERE debate_id = ?'
    ).all(id) as ArgumentNode[];

    const argument_edges = db.prepare(
      'SELECT * FROM argument_edges WHERE debate_id = ?'
    ).all(id) as ArgumentEdge[];

    // Calculate cumulative totals
    let totalA = 0;
    let totalB = 0;
    let countA = 0;
    let countB = 0;

    for (const seg of segmentsWithScores) {
      for (const score of seg.scores) {
        if (score.debater === 'A') { totalA += score.total_score; countA++; }
        if (score.debater === 'B') { totalB += score.total_score; countB++; }
      }
    }

    const result: DebateWithDetails = {
      ...debate,
      segments: segmentsWithScores,
      argument_nodes,
      argument_edges,
      totals: {
        debater_a: countA > 0 ? Math.round((totalA / countA) * 10) / 10 : 0,
        debater_b: countB > 0 ? Math.round((totalB / countB) * 10) / 10 : 0,
      },
    };

    return NextResponse.json(result);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to fetch debate' }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = getDb();
    db.prepare('DELETE FROM debates WHERE id = ?').run(id);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to delete debate' }, { status: 500 });
  }
}
