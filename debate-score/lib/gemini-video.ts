import { GoogleGenerativeAI } from '@google/generative-ai';

const MODEL = 'gemini-2.0-flash-exp';

export interface FullDebateAnalysis {
  debate_title: string;
  debater_a_name: string;
  debater_b_name: string;
  segments: SegmentResult[];
}

export interface SegmentResult {
  round_number: number;
  topic: string;
  summary: string;
  scores: {
    debater_a: ScoreData;
    debater_b: ScoreData;
  };
  moments: MomentData[];
  argument_nodes: NodeData[];
  argument_edges: EdgeData[];
}

interface ScoreData {
  evidence_score: number;
  logic_score: number;
  claim_support_score: number;
  definition_clarity_score: number;
  policy_relevance_score: number;
  rhetorical_composure_score: number;
  debate_discipline_score: number;
  framing_control_score: number;
  notes: string;
}

interface MomentData {
  type: 'strong_claim' | 'contradiction' | 'ad_hominem' | 'interruption' | 'concession';
  description: string;
  debater: 'A' | 'B' | 'both';
  timestamp?: string;
}

interface NodeData {
  node_id: string;
  debater: 'A' | 'B';
  claim: string;
  type: 'claim' | 'rebuttal' | 'evidence' | 'concession';
}

interface EdgeData {
  source_node_id: string;
  target_node_id: string;
  relationship: 'supports' | 'rebuts' | 'concedes_to' | 'qualifies';
}

const PROMPT = `You are an expert debate analyst. Watch this debate video carefully.

1. Identify both debaters by name.
2. Divide the debate into 5–10 logical segments/rounds.
3. For each segment, score both debaters and map the argument structure.

Scoring metrics (0–10 scale, decimals allowed):
- evidence_score: Quality and relevance of evidence cited
- logic_score: Internal consistency, absence of self-contradiction
- claim_support_score: Whether claims are properly supported
- definition_clarity_score: Clear, precise use of key terms
- policy_relevance_score: Relevance to the core debate topic
- rhetorical_composure_score: Tone, poise, emotional intelligence
- debate_discipline_score: Avoiding interruptions, personal attacks, tangents
- framing_control_score: Ability to set the terms of discussion

Moment types: strong_claim, contradiction, ad_hominem, interruption, concession
Node types: claim, rebuttal, evidence, concession
Edge relationships: supports, rebuts, concedes_to, qualifies

Return ONLY valid JSON in this exact structure:
{
  "debate_title": "Short descriptive title",
  "debater_a_name": "First debater's full name",
  "debater_b_name": "Second debater's full name",
  "segments": [
    {
      "round_number": 1,
      "topic": "Brief topic of this segment",
      "summary": "2-3 sentence neutral summary",
      "scores": {
        "debater_a": {
          "evidence_score": 7.5,
          "logic_score": 8.0,
          "claim_support_score": 7.0,
          "definition_clarity_score": 6.5,
          "policy_relevance_score": 8.0,
          "rhetorical_composure_score": 7.0,
          "debate_discipline_score": 9.0,
          "framing_control_score": 7.5,
          "notes": "Brief justification"
        },
        "debater_b": {
          "evidence_score": 6.0,
          "logic_score": 7.0,
          "claim_support_score": 6.5,
          "definition_clarity_score": 7.5,
          "policy_relevance_score": 7.0,
          "rhetorical_composure_score": 8.0,
          "debate_discipline_score": 7.0,
          "framing_control_score": 6.0,
          "notes": "Brief justification"
        }
      },
      "moments": [
        { "type": "strong_claim", "description": "...", "debater": "A", "timestamp": "optional" }
      ],
      "argument_nodes": [
        { "node_id": "n1", "debater": "A", "claim": "Brief claim text", "type": "claim" }
      ],
      "argument_edges": [
        { "source_node_id": "n2", "target_node_id": "n1", "relationship": "rebuts" }
      ]
    }
  ]
}`;

export async function analyzeYouTubeDebate(youtubeUrl: string): Promise<FullDebateAnalysis> {
  const apiKey = process.env.GOOGLE_AI_API_KEY;
  if (!apiKey) throw new Error('GOOGLE_AI_API_KEY is not set');

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: MODEL });

  const result = await model.generateContent([
    {
      fileData: {
        fileUri: youtubeUrl,
        mimeType: 'video/*',
      },
    },
    PROMPT,
  ]);

  const text = result.response.text().trim();
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('Could not extract JSON from Gemini response');

  const analysis: FullDebateAnalysis = JSON.parse(jsonMatch[0]);
  return analysis;
}
