import Database from 'better-sqlite3'
import { PROPOSAL_EVENTS_SCHEMA } from '../src/infrastructure/persistence/schema-proposal-events.ts'
import { appCerrada } from './app-cerrada.ts'

// One-shot idempotente: sintetiza el libro de las propuestas PRE-I1.5-b. Solo
// eventos deducibles (SELECT + transicion final), marcados synthetic; coste y
// duracion quedan NULL — no se inventan numeros. Se corre SOLO desde CLI.
// Autocontenido a proposito: Node corre .ts sueltos sin resolver los alias ni
// los imports sin extension del src, asi que aqui no se importa el dominio.
// Exige --base explicita y la app cerrada, y escribe en UNA transaccion. Antes
// de nombrar la viva: ensaya sobre una copia y haz backup a mano (CLAUDE.md §4).
//   npm run backfill:proposal-events -- --base <ruta>
// Es global (no va por proyecto), asi que lee solo --base, sin leerArgumentos.
const argv = process.argv.slice(2)
const i = argv.indexOf('--base')
const base = i === -1 ? null : (argv[i + 1] ?? null)
if (base === null || base.startsWith('--')) throw new Error('fail-closed: --base es obligatoria; ensaya sobre una copia antes de nombrar la viva') // prettier-ignore
if (!appCerrada())
  throw new Error('fail-closed: la app esta abierta; cierrala antes de escribir su base')

const db = new Database(base, { fileMustExist: true })
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

// Todo o nada: un libro a medias (solo seq 1) lo saltaria la guarda NOT EXISTS
// para siempre, y la mitad no se repararia al relanzar.
db.transaction(() => {
  for (const p of proposals) {
    insert.run(crypto.randomUUID(), p.id, 1, 'SELECT', null, 'ELEGIDO', null, p.created_at)
    const phase = p.state === 'CADUCADO' ? 'EXPIRE' : 'ANALYZE'
    insert.run(crypto.randomUUID(), p.id, 2, phase, 'ELEGIDO', p.state, p.analysis_reason, p.updated_at) // prettier-ignore
  }
})()

console.log(`COMMIT sobre ${base}. backfilled ${proposals.length} of ${total} proposals`)
db.close()
