import { NextRequest, NextResponse } from 'next/server';
import { ensureDb } from '@/lib/db';
import { Debate, Segment, Score, Moment, ArgumentNode, ArgumentEdge } from '@/types';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const format = searchParams.get('format') || 'json';

    const db = await ensureDb();

    const debateResult = await db.execute({ sql: 'SELECT * FROM debates WHERE id = ?', args: [id] });
    if (!debateResult.rows.length) {
      return NextResponse.json({ error: 'Debate not found' }, { status: 404 });
    }
    const debate = debateResult.rows[0] as unknown as Debate;

    const [segmentsResult, allScoresResult, momentsResult, nodesResult, edgesResult] = await Promise.all([
      db.execute({ sql: 'SELECT * FROM segments WHERE debate_id = ? ORDER BY round_number', args: [id] }),
      db.execute({
        sql: `SELECT s.* FROM scores s JOIN segments seg ON s.segment_id = seg.id WHERE seg.debate_id = ?`,
        args: [id],
      }),
      db.execute({ sql: 'SELECT * FROM moments WHERE debate_id = ?', args: [id] }),
      db.execute({ sql: 'SELECT * FROM argument_nodes WHERE debate_id = ?', args: [id] }),
      db.execute({ sql: 'SELECT * FROM argument_edges WHERE debate_id = ?', args: [id] }),
    ]);

    const segments = segmentsResult.rows as unknown as Segment[];
    const allScores = allScoresResult.rows as unknown as Score[];
    const moments = momentsResult.rows as unknown as Moment[];
    const nodes = nodesResult.rows as unknown as ArgumentNode[];
    const edges = edgesResult.rows as unknown as ArgumentEdge[];

    if (format === 'csv') {
      const rows: string[] = [
        'Round,Topic,Debater,Evidence,Logic,ClaimSupport,DefinitionClarity,PolicyRelevance,RhetoricalComposure,DebateDiscipline,FramingControl,Total,Notes'
      ];

      for (const seg of segments) {
        const segScores = allScores.filter(s => s.segment_id === seg.id);
        for (const score of segScores) {
          rows.push([
            seg.round_number,
            `"${String(seg.topic).replace(/"/g, '""')}"`,
            score.debater === 'A' ? debate.debater_a : debate.debater_b,
            score.evidence_score, score.logic_score, score.claim_support_score,
            score.definition_clarity_score, score.policy_relevance_score,
            score.rhetorical_composure_score, score.debate_discipline_score,
            score.framing_control_score, score.total_score,
            `"${String(score.notes).replace(/"/g, '""')}"`
          ].join(','));
        }
      }

      return new NextResponse(rows.join('\n'), {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="debate-${id}.csv"`,
        },
      });
    }

    const data = {
      debate: { id: debate.id, title: debate.title, debater_a: debate.debater_a, debater_b: debate.debater_b, created_at: debate.created_at },
      rounds: segments.map(seg => ({
        round: seg.round_number,
        topic: seg.topic,
        summary: seg.summary,
        scores: allScores
          .filter(s => s.segment_id === seg.id)
          .map(s => ({
            debater: s.debater === 'A' ? debate.debater_a : debate.debater_b,
            metrics: {
              evidence: s.evidence_score, logic: s.logic_score, claim_support: s.claim_support_score,
              definition_clarity: s.definition_clarity_score, policy_relevance: s.policy_relevance_score,
              rhetorical_composure: s.rhetorical_composure_score, debate_discipline: s.debate_discipline_score,
              framing_control: s.framing_control_score,
            },
            total: s.total_score,
            notes: s.notes,
          })),
      })),
      key_moments: moments,
      argument_map: { nodes, edges },
    };

    return new NextResponse(JSON.stringify(data, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="debate-${id}.json"`,
      },
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to export debate' }, { status: 500 });
  }
}
