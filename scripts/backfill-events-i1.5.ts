import Database from 'better-sqlite3'
import { homedir } from 'os'
import { join } from 'path'
import { PROPOSAL_EVENTS_SCHEMA } from '../src/infrastructure/persistence/schema-proposal-events.ts'

// One-shot idempotente: sintetiza el libro de las propuestas PRE-I1.5-b. Solo
// eventos deducibles (SELECT + transicion final), marcados synthetic; coste y
// duracion quedan NULL — no se inventan numeros. Se corre SOLO desde CLI.
// Autocontenido a proposito: Node corre .ts sueltos sin resolver los alias ni
// los imports sin extension del src, asi que aqui no se importa el dominio.
const db = new Database(join(homedir(), '.config/fortress-command-center/fortress.db'))
// La tabla la crea la app al arrancar, pero este one-shot puede correr ANTES
// del rebuild: el schema es idempotente y aplicarlo aqui no pisa nada.
db.exec(PROPOSAL_EVENTS_SCHEMA)

interface Row {
  readonly id: string
  readonly state: string
  readonly analysis_reason: string | null
  readonly created_at: number
  readonly updated_at: number
}

const insert = db.prepare(`INSERT INTO proposal_events (id, proposal_id, seq, phase, event_type,
  from_state, to_state, actor, reason, evidence_json, ts) VALUES (?, ?, ?, ?, 'TRANSITION',
  ?, ?, 'motor', ?, '{"synthetic":true}', ?)`)

const proposals = db
  .prepare(
    `SELECT id, state, analysis_reason, created_at, updated_at
     FROM repair_proposals p
     WHERE NOT EXISTS (SELECT 1 FROM proposal_events e WHERE e.proposal_id = p.id)`
  )
  .all() as Row[]
const total = (db.prepare('SELECT COUNT(*) AS n FROM repair_proposals').get() as { n: number }).n

for (const p of proposals) {
  insert.run(crypto.randomUUID(), p.id, 1, 'SELECT', null, 'ELEGIDO', null, p.created_at)
  const phase = p.state === 'CADUCADO' ? 'EXPIRE' : 'ANALYZE'
  insert.run(crypto.randomUUID(), p.id, 2, phase, 'ELEGIDO', p.state, p.analysis_reason, p.updated_at) // prettier-ignore
}

console.log(`backfilled ${proposals.length} of ${total} proposals`)
db.close()
