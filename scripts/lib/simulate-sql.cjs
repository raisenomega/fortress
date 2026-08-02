/** INSERTs de la siembra del preview. Solo para scripts de verificacion. */
const INSERT_RUN = `INSERT INTO agent_runs (id, project_id, agent_id, kind, duration_ms,
  failed, input_tokens, output_tokens, cache_read_tokens, cache_creation_tokens,
  cost_usd, num_turns, edits, tools, at)
  VALUES (?, ?, 'security-reviewer', 'scan', 54000, 0, 2, 1840, 15273, 5807, ?, 1, 0, 'Read,Grep', ?)`
const INSERT_ACTIVITY = `INSERT INTO activity (id, project_id, agent_id, kind, summary,
  severity, file, line, at) VALUES (?, ?, 'security-reviewer', ?, ?, ?, ?, ?, ?)`
const INSERT = `INSERT INTO findings (id, project_id, severity, title, file, line, created_at)
  VALUES (?, ?, ?, ?, ?, ?, ?)`

const INSERT_SCAN = `INSERT INTO scans (id, project_id, score, finding_count,
  critical_count, duration_ms, at) VALUES (?, ?, ?, ?, ?, 54000, ?)`

module.exports = { INSERT, INSERT_ACTIVITY, INSERT_RUN, INSERT_SCAN }
