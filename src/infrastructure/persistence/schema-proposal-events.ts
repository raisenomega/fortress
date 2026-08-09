/** Libro de vida de las propuestas: un evento por eslabon, con coste y razon. */
export const PROPOSAL_EVENTS_SCHEMA = `
CREATE TABLE IF NOT EXISTS proposal_events (
  id TEXT PRIMARY KEY,
  proposal_id TEXT NOT NULL REFERENCES repair_proposals(id) ON DELETE CASCADE,
  seq INTEGER NOT NULL,
  phase TEXT NOT NULL,
  event_type TEXT NOT NULL,
  from_state TEXT,
  to_state TEXT,
  actor TEXT NOT NULL,
  agent_run_id TEXT,
  scan_id TEXT,
  reason TEXT,
  cost_tokens INTEGER,
  duration_ms INTEGER,
  evidence_json TEXT,
  ts INTEGER NOT NULL,
  UNIQUE(proposal_id, seq)
);
CREATE INDEX IF NOT EXISTS idx_pe_proposal ON proposal_events(proposal_id, seq);
CREATE INDEX IF NOT EXISTS idx_pe_agent_run ON proposal_events(agent_run_id);
`
