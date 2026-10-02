import Database from 'better-sqlite3'
import { homedir } from 'os'
import { join } from 'path'
import { appCerrada } from './app-cerrada.ts'

// One-shot idempotente: caduca las propuestas VIVAS cuyo libro es entero
// sintetico (backfill). Sin analisis persistido, C3 no puede generar y el guard
// las rechaza siempre — se quedan bloqueando la cuenta de pendientes para
// siempre. Al caducarlas, su hallazgo vuelve a la baraja y el motor lo puede
// reintentar con una cadena completa.
//
// Autocontenido a proposito, como el backfill: Node corre .ts sueltos sin
// resolver los alias del src. Corre SOLO desde CLI y con la app cerrada.
if (!appCerrada())
  throw new Error('fail-closed: la app esta abierta; cierrala antes de escribir su base')
const db = new Database(join(homedir(), '.config/fortress-command-center/fortress.db'))

const RAZON = 'cadena_sintetica'
const VIVOS = "state NOT IN ('CADUCADO', 'MERGEADO', 'RECHAZADO')"

interface Fila {
  readonly id: string
  readonly state: string
}

const candidatas = db.prepare(`SELECT id, state FROM repair_proposals WHERE ${VIVOS}`).all() as Fila[] // prettier-ignore
const eventos = db.prepare('SELECT evidence_json FROM proposal_events WHERE proposal_id = ?')
const topeSeq = db.prepare('SELECT MAX(seq) AS n FROM proposal_events WHERE proposal_id = ?')
const caducar = db.prepare(`UPDATE repair_proposals SET state = 'CADUCADO',
  analysis_reason = ?, updated_at = ? WHERE id = ?`)
const asentar = db.prepare(`INSERT INTO proposal_events (id, proposal_id, seq, phase, event_type,
  from_state, to_state, actor, reason, ts) VALUES (?, ?, ?, 'EXPIRE', 'TRANSITION',
  ?, 'CADUCADO', 'motor', ?, ?)`)

const sintetica = (id: string): boolean => {
  const filas = eventos.all(id) as { evidence_json: string | null }[]
  return filas.length > 0 && filas.every((e) => (e.evidence_json ?? '').includes('"synthetic"'))
}

let caducadas = 0
for (const p of candidatas.filter((p) => sintetica(p.id))) {
  const now = Date.now()
  const seq = ((topeSeq.get(p.id) as { n: number | null }).n ?? 0) + 1
  db.transaction(() => {
    caducar.run(RAZON, now, p.id)
    asentar.run(crypto.randomUUID(), p.id, seq, p.state, RAZON, now)
  })()
  console.log(`caducada ${p.id.slice(0, 8)} (${p.state} -> CADUCADO) por ${RAZON}`)
  caducadas += 1
}

console.log(`${caducadas} de ${candidatas.length} propuestas vivas tenian el libro sintetico`)
db.close()
