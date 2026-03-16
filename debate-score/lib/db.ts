import { createClient, Client } from '@libsql/client';

let _client: Client | null = null;
let _schemaInit: Promise<void> | null = null;

export function getDb(): Client {
  if (_client) return _client;
  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;
  if (!url) throw new Error('TURSO_DATABASE_URL is not set');
  _client = createClient({ url, authToken });
  return _client;
}

export async function ensureDb(): Promise<Client> {
  const db = getDb();
  if (!_schemaInit) {
    _schemaInit = initSchema(db);
  }
  await _schemaInit;
  return db;
}

async function initSchema(db: Client): Promise<void> {
  await db.executeMultiple(`
    CREATE TABLE IF NOT EXISTS debates (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      debater_a TEXT NOT NULL,
      debater_b TEXT NOT NULL,
      transcript TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS segments (
      id TEXT PRIMARY KEY,
      debate_id TEXT NOT NULL REFERENCES debates(id) ON DELETE CASCADE,
      round_number INTEGER NOT NULL,
      topic TEXT NOT NULL,
      content TEXT NOT NULL,
      summary TEXT NOT NULL DEFAULT '',
      start_time TEXT,
      end_time TEXT
    );

    CREATE TABLE IF NOT EXISTS scores (
      id TEXT PRIMARY KEY,
      segment_id TEXT NOT NULL REFERENCES segments(id) ON DELETE CASCADE,
      debater TEXT NOT NULL,
      evidence_score REAL NOT NULL DEFAULT 0,
      logic_score REAL NOT NULL DEFAULT 0,
      claim_support_score REAL NOT NULL DEFAULT 0,
      definition_clarity_score REAL NOT NULL DEFAULT 0,
      policy_relevance_score REAL NOT NULL DEFAULT 0,
      rhetorical_composure_score REAL NOT NULL DEFAULT 0,
      debate_discipline_score REAL NOT NULL DEFAULT 0,
      framing_control_score REAL NOT NULL DEFAULT 0,
      total_score REAL NOT NULL DEFAULT 0,
      notes TEXT NOT NULL DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS moments (
      id TEXT PRIMARY KEY,
      debate_id TEXT NOT NULL REFERENCES debates(id) ON DELETE CASCADE,
      segment_id TEXT NOT NULL REFERENCES segments(id) ON DELETE CASCADE,
      type TEXT NOT NULL,
      description TEXT NOT NULL,
      debater TEXT NOT NULL,
      timestamp TEXT
    );

    CREATE TABLE IF NOT EXISTS argument_nodes (
      id TEXT PRIMARY KEY,
      debate_id TEXT NOT NULL REFERENCES debates(id) ON DELETE CASCADE,
      segment_id TEXT NOT NULL REFERENCES segments(id) ON DELETE CASCADE,
      debater TEXT NOT NULL,
      claim TEXT NOT NULL,
      type TEXT NOT NULL,
      position_x REAL DEFAULT 0,
      position_y REAL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS argument_edges (
      id TEXT PRIMARY KEY,
      debate_id TEXT NOT NULL REFERENCES debates(id) ON DELETE CASCADE,
      source_node_id TEXT NOT NULL,
      target_node_id TEXT NOT NULL,
      relationship TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_segments_debate ON segments(debate_id);
    CREATE INDEX IF NOT EXISTS idx_scores_segment ON scores(segment_id);
    CREATE INDEX IF NOT EXISTS idx_moments_debate ON moments(debate_id);
    CREATE INDEX IF NOT EXISTS idx_argument_nodes_debate ON argument_nodes(debate_id);
    CREATE INDEX IF NOT EXISTS idx_argument_edges_debate ON argument_edges(debate_id);
  `);
}
