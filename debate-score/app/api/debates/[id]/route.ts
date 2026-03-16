import { NextRequest, NextResponse } from 'next/server';
import { ensureDb } from '@/lib/db';
import { Debate, Segment, Score, Moment, ArgumentNode, ArgumentEdge, DebateWithDetails } from '@/types';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = await ensureDb();

    const debateResult = await db.execute({ sql: 'SELECT * FROM debates WHERE id = ?', args: [id] });
    if (!debateResult.rows.length) {
      return NextResponse.json({ error: 'Debate not found' }, { status: 404 });
    }
    const debate = debateResult.rows[0] as unknown as Debate;

    const segmentsResult = await db.execute({
      sql: 'SELECT * FROM segments WHERE debate_id = ? ORDER BY round_number ASC',
      args: [id],
    });
    const segments = segmentsResult.rows as unknown as Segment[];

    const segmentsWithScores = await Promise.all(
      segments.map(async seg => {
        const [scoresResult, momentsResult] = await Promise.all([
          db.execute({ sql: 'SELECT * FROM scores WHERE segment_id = ?', args: [seg.id] }),
          db.execute({ sql: 'SELECT * FROM moments WHERE segment_id = ?', args: [seg.id] }),
        ]);
        return {
          ...seg,
          scores: scoresResult.rows as unknown as Score[],
          moments: momentsResult.rows as unknown as Moment[],
        };
      })
    );

    const [nodesResult, edgesResult] = await Promise.all([
      db.execute({ sql: 'SELECT * FROM argument_nodes WHERE debate_id = ?', args: [id] }),
      db.execute({ sql: 'SELECT * FROM argument_edges WHERE debate_id = ?', args: [id] }),
    ]);

    const argument_nodes = nodesResult.rows as unknown as ArgumentNode[];
    const argument_edges = edgesResult.rows as unknown as ArgumentEdge[];

    let totalA = 0, totalB = 0, countA = 0, countB = 0;
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
    const db = await ensureDb();
    await db.execute({ sql: 'DELETE FROM debates WHERE id = ?', args: [id] });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to delete debate' }, { status: 500 });
  }
}
