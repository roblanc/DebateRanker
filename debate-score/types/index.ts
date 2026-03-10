export interface Debate {
  id: string;
  title: string;
  debater_a: string;
  debater_b: string;
  transcript: string;
  status: 'pending' | 'analyzing' | 'complete' | 'error';
  created_at: string;
}

export interface Segment {
  id: string;
  debate_id: string;
  round_number: number;
  topic: string;
  content: string;
  summary: string;
  start_time?: string;
  end_time?: string;
}

export interface Score {
  id: string;
  segment_id: string;
  debater: 'A' | 'B';
  evidence_score: number;
  logic_score: number;
  claim_support_score: number;
  definition_clarity_score: number;
  policy_relevance_score: number;
  rhetorical_composure_score: number;
  debate_discipline_score: number;
  framing_control_score: number;
  total_score: number;
  notes: string;
}

export interface Moment {
  id: string;
  debate_id: string;
  segment_id: string;
  type: 'strong_claim' | 'contradiction' | 'ad_hominem' | 'interruption' | 'concession';
  description: string;
  debater: 'A' | 'B' | 'both';
  timestamp?: string;
}

export interface ArgumentNode {
  id: string;
  debate_id: string;
  segment_id: string;
  debater: 'A' | 'B';
  claim: string;
  type: 'claim' | 'rebuttal' | 'evidence' | 'concession';
  position_x?: number;
  position_y?: number;
}

export interface ArgumentEdge {
  id: string;
  debate_id: string;
  source_node_id: string;
  target_node_id: string;
  relationship: 'supports' | 'rebuts' | 'concedes_to' | 'qualifies';
}

export interface SegmentAnalysis {
  topic: string;
  summary: string;
  scores: {
    debater_a: ScoreInput;
    debater_b: ScoreInput;
  };
  moments: MomentInput[];
  argument_nodes: ArgumentNodeInput[];
  argument_edges: ArgumentEdgeInput[];
}

export interface ScoreInput {
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

export interface MomentInput {
  type: 'strong_claim' | 'contradiction' | 'ad_hominem' | 'interruption' | 'concession';
  description: string;
  debater: 'A' | 'B' | 'both';
  timestamp?: string;
}

export interface ArgumentNodeInput {
  debater: 'A' | 'B';
  claim: string;
  type: 'claim' | 'rebuttal' | 'evidence' | 'concession';
  node_id: string;
}

export interface ArgumentEdgeInput {
  source_node_id: string;
  target_node_id: string;
  relationship: 'supports' | 'rebuts' | 'concedes_to' | 'qualifies';
}

export interface DebateWithDetails extends Debate {
  segments: (Segment & {
    scores: Score[];
    moments: Moment[];
  })[];
  argument_nodes: ArgumentNode[];
  argument_edges: ArgumentEdge[];
  totals: {
    debater_a: number;
    debater_b: number;
  };
}
