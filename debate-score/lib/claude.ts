import { SegmentAnalysis } from '@/types';

// OpenRouter — OpenAI-compatible API
// Free models: google/gemini-2.0-flash-exp:free, meta-llama/llama-3.3-70b-instruct:free
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const MODEL = process.env.OPENROUTER_MODEL || 'google/gemini-2.0-flash-exp:free';

export const SYSTEM_PROMPT = `You are an expert debate analyst and rhetorical scholar. Your role is to objectively evaluate debate segments based purely on debate mechanics — logic, evidence quality, rhetorical structure, and argumentation. You do NOT evaluate political positions, ideological correctness, or factual accuracy of claims (only whether they are logically supported within the debate).

You analyze debates with the precision of a professional debate judge, identifying strong arguments, logical fallacies, rhetorical devices, and argumentation structure.`;

export const ANALYSIS_PROMPT = (
  segment: string,
  debaterA: string,
  debaterB: string,
  roundNumber: number
) => `Analyze this debate segment (Round ${roundNumber}) between ${debaterA} (Debater A) and ${debaterB} (Debater B).

TRANSCRIPT SEGMENT:
---
${segment}
---

Score each debater on these metrics (0-10 scale, decimals allowed):
1. **Evidence / Use of Data** — Quality and relevance of evidence cited
2. **Logical Consistency** — Internal consistency, absence of self-contradiction
3. **Claim Support / Burden of Proof** — Whether claims are properly supported
4. **Definition Clarity** — Clear, precise use of key terms
5. **Policy Relevance** — Relevance to the core debate topic
6. **Rhetorical Composure** — Tone, poise, emotional intelligence
7. **Debate Discipline** — Avoiding interruptions, personal attacks, tangents
8. **Framing Control** — Ability to set the terms of discussion

Also identify:
- Key moments (strong claims, contradictions, ad hominem attacks, interruptions, concessions)
- Argument nodes (individual claims/rebuttals/evidence items as graph nodes)
- Argument edges (how arguments connect: supports, rebuts, concedes_to, qualifies)

Respond with valid JSON ONLY in this exact structure:
{
  "topic": "Brief topic/theme of this round",
  "summary": "2-3 sentence neutral summary of this exchange",
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
      "notes": "Brief justification for scores"
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
      "notes": "Brief justification for scores"
    }
  },
  "moments": [
    {
      "type": "strong_claim",
      "description": "Brief description of the moment",
      "debater": "A",
      "timestamp": "optional if visible in transcript"
    }
  ],
  "argument_nodes": [
    {
      "node_id": "n1",
      "debater": "A",
      "claim": "Brief statement of the claim",
      "type": "claim"
    }
  ],
  "argument_edges": [
    {
      "source_node_id": "n2",
      "target_node_id": "n1",
      "relationship": "rebuts"
    }
  ]
}

Moment types: strong_claim, contradiction, ad_hominem, interruption, concession
Argument node types: claim, rebuttal, evidence, concession
Argument edge relationships: supports, rebuts, concedes_to, qualifies
Debater values: "A", "B", or "both" (for moments only)`;

export async function analyzeSegment(
  segment: string,
  debaterA: string,
  debaterB: string,
  roundNumber: number
): Promise<SegmentAnalysis> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error('OPENROUTER_API_KEY is not set');

  const res = await fetch(OPENROUTER_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://debaterank.app',
      'X-Title': 'DebateRank',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 4000,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: ANALYSIS_PROMPT(segment, debaterA, debaterB, roundNumber) },
      ],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenRouter error ${res.status}: ${err}`);
  }

  const data = await res.json();
  const text: string = data.choices?.[0]?.message?.content?.trim();

  if (!text) throw new Error('No text response from model');

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('Could not extract JSON from response');

  const analysis: SegmentAnalysis = JSON.parse(jsonMatch[0]);
  return analysis;
}
