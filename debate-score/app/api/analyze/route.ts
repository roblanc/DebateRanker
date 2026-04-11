import { NextRequest, NextResponse, after } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { ensureDb } from '@/lib/db';
import { analyzeSegment } from '@/lib/claude';
import { analyzeYouTubeDebate } from '@/lib/gemini-video';
import { segmentTranscript, extractTimestamp } from '@/lib/segmenter';
import { Debate } from '@/types';
import { Client } from '@libsql/client';

function isYouTubeUrl(str: string): boolean {
  return /^https?:\/\/(www\.)?(youtube\.com|youtu\.be)\//.test(str.trim());
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { debate_id } = body;

    if (!debate_id) {
      return NextResponse.json({ error: 'debate_id is required' }, { status: 400 });
    }

    const db = await ensureDb();
    const debateResult = await db.execute({ sql: 'SELECT * FROM debates WHERE id = ?', args: [debate_id] });
    const debate = debateResult.rows[0] as unknown as Debate | undefined;

    if (!debate) {
      return NextResponse.json({ error: 'Debate not found' }, { status: 404 });
    }

    console.log(`[API] Starting analysis for debate ${debate_id}...`);

    await db.execute({ sql: "UPDATE debates SET status = 'analyzing' WHERE id = ?", args: [debate_id] });

    // Delete any existing analysis
    console.log(`[API] Clearing existing analysis for ${debate_id}...`);
    await Promise.all([
      db.execute({ sql: 'DELETE FROM segments WHERE debate_id = ?', args: [debate_id] }),
      db.execute({ sql: 'DELETE FROM moments WHERE debate_id = ?', args: [debate_id] }),
      db.execute({ sql: 'DELETE FROM argument_nodes WHERE debate_id = ?', args: [debate_id] }),
      db.execute({ sql: 'DELETE FROM argument_edges WHERE debate_id = ?', args: [debate_id] }),
    ]);

    // after() keeps the serverless function alive after the response is sent
    after(async () => {
      console.log(`[Background] Analysis task started for ${debate_id}`);
      try {
        if (isYouTubeUrl(debate.transcript)) {
          await analyzeDebateFromYouTube(debate_id, debate, db);
        } else {
          await analyzeDebate(debate_id, debate, db);
        }
        console.log(`[Background] Analysis completed successfully for ${debate_id}`);
      } catch (err) {
        console.error(`[Background] Analysis failed for ${debate_id}:`, err);
        // Attempt to mark as error in DB
        try {
          const errorDb = await ensureDb();
          await errorDb.execute({ sql: "UPDATE debates SET status = 'error' WHERE id = ?", args: [debate_id] });
        } catch (dbErr) {
          console.error(`[Background] Failed to update error status in DB:`, dbErr);
        }
      }
    });

    return NextResponse.json({ message: 'Analysis started', debate_id });
  } catch (err) {
    console.error(`[API] POST /api/analyze error:`, err);
    return NextResponse.json({ error: 'Failed to start analysis' }, { status: 500 });
  }
}

async function analyzeDebate(debateId: string, debate: Debate, db: Client) {
  console.log(`[Background] Segmenting transcript for ${debateId}...`);
  const segments = segmentTranscript(debate.transcript);
  console.log(`[Background] Split into ${segments.length} segments.`);

  if (segments.length === 0) {
    throw new Error('No segments extracted from transcript');
  }

  const nodeIdMap: Map<string, string> = new Map();

  for (let i = 0; i < segments.length; i++) {
    const segmentContent = segments[i];
    const roundNumber = i + 1;

    console.log(`[Background] Analyzing segment ${roundNumber}/${segments.length}...`);
    const analysis = await analyzeSegment(
      segmentContent,
      debate.debater_a,
      debate.debater_b,
      roundNumber
    );
    console.log(`[Background] Analysis received for segment ${roundNumber}.`);

    const segmentId = uuidv4();
    const startTime = extractTimestamp(segmentContent);

    await db.execute({
      sql: `INSERT INTO segments (id, debate_id, round_number, topic, content, summary, start_time)
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
      args: [segmentId, debateId, roundNumber, analysis.topic || `Round ${roundNumber}`, segmentContent, analysis.summary || '', startTime || null],
    });

    const insertScore = async (debater: 'A' | 'B', scoreData: typeof analysis.scores.debater_a) => {
      const total = (
        scoreData.evidence_score + scoreData.logic_score + scoreData.claim_support_score +
        scoreData.definition_clarity_score + scoreData.policy_relevance_score +
        scoreData.rhetorical_composure_score + scoreData.debate_discipline_score +
        scoreData.framing_control_score
      ) / 8;

      await db.execute({
        sql: `INSERT INTO scores (id, segment_id, debater, evidence_score, logic_score,
              claim_support_score, definition_clarity_score, policy_relevance_score,
              rhetorical_composure_score, debate_discipline_score, framing_control_score,
              total_score, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          uuidv4(), segmentId, debater,
          scoreData.evidence_score, scoreData.logic_score, scoreData.claim_support_score,
          scoreData.definition_clarity_score, scoreData.policy_relevance_score,
          scoreData.rhetorical_composure_score, scoreData.debate_discipline_score,
          scoreData.framing_control_score, Math.round(total * 10) / 10, scoreData.notes || '',
        ],
      });
    };

    await Promise.all([insertScore('A', analysis.scores.debater_a), insertScore('B', analysis.scores.debater_b)]);

    if (analysis.moments) {
      for (const moment of analysis.moments) {
        await db.execute({
          sql: `INSERT INTO moments (id, debate_id, segment_id, type, description, debater, timestamp)
                VALUES (?, ?, ?, ?, ?, ?, ?)`,
          args: [uuidv4(), debateId, segmentId, moment.type, moment.description, moment.debater, moment.timestamp || null],
        });
      }
    }

    if (analysis.argument_nodes) {
      let aCount = 0, bCount = 0;
      for (const node of analysis.argument_nodes) {
        const dbId = uuidv4();
        nodeIdMap.set(`${debateId}-${node.node_id}`, dbId);
        const xPos = node.debater === 'A' ? 50 + (i * 300) : 350 + (i * 300);
        const yPos = node.debater === 'A' ? 50 + (aCount++ * 100) : 50 + (bCount++ * 100);

        await db.execute({
          sql: `INSERT INTO argument_nodes (id, debate_id, segment_id, debater, claim, type, position_x, position_y)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          args: [dbId, debateId, segmentId, node.debater, node.claim, node.type, xPos, yPos],
        });
      }
    }

    if (analysis.argument_edges) {
      for (const edge of analysis.argument_edges) {
        const sourceId = nodeIdMap.get(`${debateId}-${edge.source_node_id}`);
        const targetId = nodeIdMap.get(`${debateId}-${edge.target_node_id}`);
        if (sourceId && targetId) {
          await db.execute({
            sql: `INSERT INTO argument_edges (id, debate_id, source_node_id, target_node_id, relationship)
                  VALUES (?, ?, ?, ?, ?)`,
            args: [uuidv4(), debateId, sourceId, targetId, edge.relationship],
          });
        }
      }
    }
    console.log(`[Background] Finished processing segment ${roundNumber}.`);
  }

  console.log(`[Background] Finalizing debate status for ${debateId}...`);
  await db.execute({ sql: "UPDATE debates SET status = 'complete' WHERE id = ?", args: [debateId] });
}

async function analyzeDebateFromYouTube(debateId: string, debate: Debate, db: Client) {
  console.log(`[Background] Sending YouTube URL to Gemini for ${debateId}...`);
  const fullAnalysis = await analyzeYouTubeDebate(debate.transcript);

  // Update debater names if Gemini detected them
  if (fullAnalysis.debater_a_name && fullAnalysis.debater_b_name) {
    await db.execute({
      sql: 'UPDATE debates SET debater_a = ?, debater_b = ?, title = ? WHERE id = ?',
      args: [fullAnalysis.debater_a_name, fullAnalysis.debater_b_name, fullAnalysis.debate_title, debateId],
    });
  }

  const nodeIdMap: Map<string, string> = new Map();

  for (const seg of fullAnalysis.segments) {
    const segmentId = uuidv4();
    const roundNumber = seg.round_number;

    await db.execute({
      sql: `INSERT INTO segments (id, debate_id, round_number, topic, content, summary, start_time)
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
      args: [segmentId, debateId, roundNumber, seg.topic, '', seg.summary, null],
    });

    const insertScore = async (debater: 'A' | 'B', scoreData: typeof seg.scores.debater_a) => {
      const total = (
        scoreData.evidence_score + scoreData.logic_score + scoreData.claim_support_score +
        scoreData.definition_clarity_score + scoreData.policy_relevance_score +
        scoreData.rhetorical_composure_score + scoreData.debate_discipline_score +
        scoreData.framing_control_score
      ) / 8;

      await db.execute({
        sql: `INSERT INTO scores (id, segment_id, debater, evidence_score, logic_score,
              claim_support_score, definition_clarity_score, policy_relevance_score,
              rhetorical_composure_score, debate_discipline_score, framing_control_score,
              total_score, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          uuidv4(), segmentId, debater,
          scoreData.evidence_score, scoreData.logic_score, scoreData.claim_support_score,
          scoreData.definition_clarity_score, scoreData.policy_relevance_score,
          scoreData.rhetorical_composure_score, scoreData.debate_discipline_score,
          scoreData.framing_control_score, Math.round(total * 10) / 10, scoreData.notes || '',
        ],
      });
    };

    await Promise.all([insertScore('A', seg.scores.debater_a), insertScore('B', seg.scores.debater_b)]);

    for (const moment of (seg.moments || [])) {
      await db.execute({
        sql: `INSERT INTO moments (id, debate_id, segment_id, type, description, debater, timestamp)
              VALUES (?, ?, ?, ?, ?, ?, ?)`,
        args: [uuidv4(), debateId, segmentId, moment.type, moment.description, moment.debater, moment.timestamp || null],
      });
    }

    let aCount = 0, bCount = 0;
    for (const node of (seg.argument_nodes || [])) {
      const dbId = uuidv4();
      nodeIdMap.set(`${debateId}-${node.node_id}`, dbId);
      const xPos = node.debater === 'A' ? 50 + ((roundNumber - 1) * 300) : 350 + ((roundNumber - 1) * 300);
      const yPos = node.debater === 'A' ? 50 + (aCount++ * 100) : 50 + (bCount++ * 100);

      await db.execute({
        sql: `INSERT INTO argument_nodes (id, debate_id, segment_id, debater, claim, type, position_x, position_y)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [dbId, debateId, segmentId, node.debater, node.claim, node.type, xPos, yPos],
      });
    }

    for (const edge of (seg.argument_edges || [])) {
      const sourceId = nodeIdMap.get(`${debateId}-${edge.source_node_id}`);
      const targetId = nodeIdMap.get(`${debateId}-${edge.target_node_id}`);
      if (sourceId && targetId) {
        await db.execute({
          sql: `INSERT INTO argument_edges (id, debate_id, source_node_id, target_node_id, relationship)
                VALUES (?, ?, ?, ?, ?)`,
          args: [uuidv4(), debateId, sourceId, targetId, edge.relationship],
        });
      }
    }

    console.log(`[Background] Stored segment ${roundNumber} for ${debateId}`);
  }

  await db.execute({ sql: "UPDATE debates SET status = 'complete' WHERE id = ?", args: [debateId] });
  console.log(`[Background] YouTube analysis complete for ${debateId}`);
}
