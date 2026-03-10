# DebateScore — Architecture

## Overview

DebateScore is a Next.js 16 web application that analyzes debate transcripts using Claude Opus 4.6, producing structured scoring similar to sports statistics.

## Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| LLM | Claude Opus 4.6 (Adaptive Thinking) |
| Database | SQLite via better-sqlite3 |
| Charts | Recharts |
| Argument Map | ReactFlow |

## Directory Structure

```
debate-score/
├── app/
│   ├── page.tsx                    # Home: upload form + debate list
│   ├── layout.tsx                  # Root layout
│   ├── globals.css
│   ├── debate/[id]/page.tsx        # Debate detail view (3-panel dashboard)
│   └── api/
│       ├── debates/route.ts        # GET (list) | POST (create)
│       ├── debates/[id]/route.ts   # GET (detail) | DELETE
│       ├── analyze/route.ts        # POST — starts async analysis
│       └── export/[id]/route.ts   # GET ?format=csv|json
├── components/
│   ├── TranscriptViewer.tsx        # Left panel: transcript with round highlighting
│   ├── ScoreTable.tsx              # Per-round metric table with score bars
│   ├── Scoreboard.tsx              # Cumulative scores + radar/line charts
│   ├── MomentsPanel.tsx            # Key moments (ad hominem, contradictions, etc.)
│   ├── ArgumentMap.tsx             # ReactFlow argument graph
│   └── DebateUpload.tsx            # Upload form (paste or drag-and-drop)
├── lib/
│   ├── db.ts                       # SQLite connection + schema init
│   ├── claude.ts                   # Claude API client + prompts
│   └── segmenter.ts                # Transcript chunking logic
├── types/index.ts                  # Shared TypeScript types
└── data/debatescore.db             # SQLite database (auto-created)
```

## Database Schema

```sql
debates        — id, title, debater_a, debater_b, transcript, status, created_at
segments       — id, debate_id, round_number, topic, content, summary, start_time
scores         — id, segment_id, debater (A|B), 8 metric scores, total_score, notes
moments        — id, debate_id, segment_id, type, description, debater, timestamp
argument_nodes — id, debate_id, segment_id, debater, claim, type, position_x/y
argument_edges — id, debate_id, source_node_id, target_node_id, relationship
```

## Core Workflow

1. **Upload**: User pastes transcript + enters debater names
2. **Segmentation**: `segmentTranscript()` splits on round markers or ~400-word chunks
3. **Analysis**: Each segment is sent to Claude Opus 4.6 (async, sequential)
4. **Storage**: Scores, moments, and argument nodes/edges stored in SQLite
5. **Display**: Dashboard auto-polls while `status = 'analyzing'`

## Claude API Usage

**Model**: `claude-opus-4-6`
**Thinking**: `{ type: "adaptive" }` for better reasoning
**Streaming**: Yes (via `client.messages.stream()` + `.finalMessage()`)
**Max tokens**: 4,000 per segment

### Example Prompt Structure

```
SYSTEM: Expert debate analyst. Scores debate mechanics only — not ideology or politics.

USER: Analyze Round 2 between Alice and Bob.

TRANSCRIPT SEGMENT:
---
[transcript text]
---

Score each on: Evidence, Logic, Claim Support, Definition Clarity,
Policy Relevance, Rhetorical Composure, Debate Discipline, Framing Control (0–10)

Also identify: key moments (strong_claim, contradiction, ad_hominem, interruption, concession)
And: argument nodes/edges for the argument map graph

Return valid JSON only.
```

## Scoring Metrics (0–10 each)

| Metric | What it Measures |
|---|---|
| Evidence / Data | Quality and relevance of cited evidence |
| Logical Consistency | Internal consistency, no self-contradiction |
| Claim Support | Whether claims carry their burden of proof |
| Definition Clarity | Precise use of key terms |
| Policy Relevance | Relevance to the core topic |
| Rhetorical Composure | Tone, poise, emotional intelligence |
| Debate Discipline | Avoiding interruptions, insults, tangents |
| Framing Control | Setting the terms of the discussion |

**Total = average of 8 metrics**

## Argument Map Design

Inspired by philosophy department argument maps (Socratic dialogue, Popper's falsificationism), the argument map visualizes the debate as a graph:

- **Nodes**: Individual claims, rebuttals, evidence items, and concessions
- **Edges**: How arguments connect (`supports`, `rebuts`, `concedes_to`, `qualifies`)
- **Colors**: Blue = Debater A, Violet = Debater B; node shape by type
- **Animated edges**: Rebuttals animate to show active contradiction

This transforms debates from "shouting matches" into intellectual ecosystems — ideas evolve, rebut each other, and occasionally go extinct.

## Export Format

### CSV
```
Round, Topic, Debater, Evidence, Logic, ClaimSupport, ..., Total, Notes
```

### JSON
```json
{
  "debate": { "id", "title", "debater_a", "debater_b" },
  "rounds": [{ "round", "topic", "summary", "scores": [...] }],
  "key_moments": [...],
  "argument_map": { "nodes": [...], "edges": [...] }
}
```
