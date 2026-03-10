import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '@/lib/db';
import { analyzeSegment } from '@/lib/claude';
import { segmentTranscript, extractTimestamp } from '@/lib/segmenter';
import { Debate } from '@/types';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { debate_id } = body;

    if (!debate_id) {
      return NextResponse.json({ error: 'debate_id is required' }, { status: 400 });
    }

    const db = getDb();
    const debate = db.prepare('SELECT * FROM debates WHERE id = ?').get(debate_id) as Debate | undefined;

    if (!debate) {
      return NextResponse.json({ error: 'Debate not found' }, { status: 404 });
    }

    if (debate.status === 'analyzing') {
      return NextResponse.json({ error: 'Debate is already being analyzed' }, { status: 409 });
    }

    // Mark as analyzing
    db.prepare("UPDATE debates SET status = 'analyzing' WHERE id = ?").run(debate_id);

    // Delete any existing analysis
    db.prepare('DELETE FROM segments WHERE debate_id = ?').run(debate_id);
    db.prepare('DELETE FROM moments WHERE debate_id = ?').run(debate_id);
    db.prepare('DELETE FROM argument_nodes WHERE debate_id = ?').run(debate_id);
    db.prepare('DELETE FROM argument_edges WHERE debate_id = ?').run(debate_id);

    // Start analysis in background
    analyzeDebate(debate_id, debate).catch(err => {
      console.error('Analysis failed:', err);
      db.prepare("UPDATE debates SET status = 'error' WHERE id = ?").run(debate_id);
    });

    return NextResponse.json({ message: 'Analysis started', debate_id });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to start analysis' }, { status: 500 });
  }
}

async function analyzeDebate(debateId: string, debate: Debate) {
  const db = getDb();

  try {
    const segments = segmentTranscript(debate.transcript);
    const nodeIdMap: Map<string, string> = new Map(); // maps analysis node_id -> db id

    for (let i = 0; i < segments.length; i++) {
      const segmentContent = segments[i];
      const roundNumber = i + 1;

      const analysis = await analyzeSegment(
        segmentContent,
        debate.debater_a,
        debate.debater_b,
        roundNumber
      );

      // Insert segment
      const segmentId = uuidv4();
      const startTime = extractTimestamp(segmentContent);

      db.prepare(
        `INSERT INTO segments (id, debate_id, round_number, topic, content, summary, start_time)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      ).run(
        segmentId,
        debateId,
        roundNumber,
        analysis.topic || `Round ${roundNumber}`,
        segmentContent,
        analysis.summary || '',
        startTime || null
      );

      // Calculate and insert scores
      const insertScore = (debater: 'A' | 'B', scoreData: typeof analysis.scores.debater_a) => {
        const total = (
          scoreData.evidence_score +
          scoreData.logic_score +
          scoreData.claim_support_score +
          scoreData.definition_clarity_score +
          scoreData.policy_relevance_score +
          scoreData.rhetorical_composure_score +
          scoreData.debate_discipline_score +
          scoreData.framing_control_score
        ) / 8;

        db.prepare(
          `INSERT INTO scores (id, segment_id, debater, evidence_score, logic_score,
           claim_support_score, definition_clarity_score, policy_relevance_score,
           rhetorical_composure_score, debate_discipline_score, framing_control_score,
           total_score, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        ).run(
          uuidv4(), segmentId, debater,
          scoreData.evidence_score, scoreData.logic_score,
          scoreData.claim_support_score, scoreData.definition_clarity_score,
          scoreData.policy_relevance_score, scoreData.rhetorical_composure_score,
          scoreData.debate_discipline_score, scoreData.framing_control_score,
          Math.round(total * 10) / 10,
          scoreData.notes || ''
        );
      };

      insertScore('A', analysis.scores.debater_a);
      insertScore('B', analysis.scores.debater_b);

      // Insert moments
      if (analysis.moments) {
        for (const moment of analysis.moments) {
          db.prepare(
            `INSERT INTO moments (id, debate_id, segment_id, type, description, debater, timestamp)
             VALUES (?, ?, ?, ?, ?, ?, ?)`
          ).run(
            uuidv4(), debateId, segmentId,
            moment.type, moment.description, moment.debater,
            moment.timestamp || null
          );
        }
      }

      // Insert argument nodes and build id map
      if (analysis.argument_nodes) {
        // Layout: A nodes on left, B nodes on right
        let aCount = 0;
        let bCount = 0;

        for (const node of analysis.argument_nodes) {
          const dbId = uuidv4();
          nodeIdMap.set(`${debateId}-${node.node_id}`, dbId);

          const xPos = node.debater === 'A' ? 50 + (i * 300) : 350 + (i * 300);
          const yPos = node.debater === 'A'
            ? 50 + (aCount++ * 100)
            : 50 + (bCount++ * 100);

          db.prepare(
            `INSERT INTO argument_nodes (id, debate_id, segment_id, debater, claim, type, position_x, position_y)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
          ).run(
            dbId, debateId, segmentId,
            node.debater, node.claim, node.type,
            xPos, yPos
          );
        }
      }

      // Insert argument edges
      if (analysis.argument_edges) {
        for (const edge of analysis.argument_edges) {
          const sourceId = nodeIdMap.get(`${debateId}-${edge.source_node_id}`);
          const targetId = nodeIdMap.get(`${debateId}-${edge.target_node_id}`);

          if (sourceId && targetId) {
            db.prepare(
              `INSERT INTO argument_edges (id, debate_id, source_node_id, target_node_id, relationship)
               VALUES (?, ?, ?, ?, ?)`
            ).run(uuidv4(), debateId, sourceId, targetId, edge.relationship);
          }
        }
      }
    }

    db.prepare("UPDATE debates SET status = 'complete' WHERE id = ?").run(debateId);
  } catch (err) {
    db.prepare("UPDATE debates SET status = 'error' WHERE id = ?").run(debateId);
    throw err;
  }
}
