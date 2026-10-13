import Database from 'better-sqlite3'
import { PROPOSAL_EVENTS_SCHEMA } from '../src/infrastructure/persistence/schema-proposal-events.ts'
import { appCerrada } from './app-cerrada.ts'

// One-shot idempotente: sintetiza el libro de las propuestas PRE-I1.5-b. Solo
// eventos deducibles (SELECT + transicion final), marcados synthetic; coste y
// duracion quedan NULL — no se inventan numeros. Se corre SOLO desde CLI.
// Autocontenido a proposito: Node corre .ts sueltos sin resolver los alias ni
// los imports sin extension del src, asi que aqui no se importa el dominio.
// Exige --base explicita, la app cerrada y un --backup VERIFICADO (integro, con
// el mismo conteo y las filas que se tocan), y escribe en UNA transaccion.
//   npm run backfill:proposal-events -- --base <ruta> --backup <copia>
// Es global (no va por proyecto), asi que lee solo sus flags, sin leerArgumentos.
const argv = process.argv.slice(2)
const flag = (n: string): string | null => {
  const v = argv.indexOf(n) === -1 ? null : (argv[argv.indexOf(n) + 1] ?? null)
  return v === null || v.startsWith('--') ? null : v
}
const base = flag('--base')
const backup = flag('--backup')
if (base === null) throw new Error('fail-closed: --base es obligatoria; ensaya sobre una copia antes de nombrar la viva') // prettier-ignore
if (backup === null) throw new Error('fail-closed: --backup es obligatoria; copia la base antes de escribirla') // prettier-ignore
if (!appCerrada())
  throw new Error('fail-closed: la app esta abierta; cierrala antes de escribir su base')

const contar = 'SELECT COUNT(*) AS n FROM repair_proposals'
// Mismo criterio que backupValido (reparar-gravedad-guardas), sobre repair_proposals.
function verificarBackup(ruta: string, vivas: number, ids: readonly string[]): void {
  let b: Database.Database | null = null
  try {
    b = new Database(ruta, { readonly: true, fileMustExist: true })
    const integridad = b.pragma('integrity_check', { simple: true }) as string
    if (integridad !== 'ok') throw new Error(`no pasa integrity_check: ${integridad}`)
    const n = (b.prepare(contar).get() as { n: number }).n
    if (n !== vivas) throw new Error(`tiene ${n} propuestas y la viva ${vivas}: es de otro momento`) // prettier-ignore
    const hay = b.prepare('SELECT COUNT(*) AS n FROM repair_proposals WHERE id = ?')
    const falta = ids.find((id) => (hay.get(id) as { n: number }).n === 0)
    if (falta !== undefined) throw new Error(`no contiene la propuesta ${falta}`)
  } catch (e) {
    throw new Error(`fail-closed: backup "${ruta}" no valido: ${(e as Error).message}`)
  } finally {
    b?.close()
  }
}

const db = new Database(base, { fileMustExist: true })
const ids = (db.prepare('SELECT id FROM repair_proposals').all() as { id: string }[]).map((r) => r.id) // prettier-ignore
const total = (db.prepare(contar).get() as { n: number }).n
verificarBackup(backup, total, ids)

// Solo es deducible la fase de un UNICO salto legal desde ELEGIDO que la deja
// inequivoca. El resto (MERGEADO, APROBADO, RECHAZADO...) no recibe seq 2: una
// fase por defecto o un salto ELEGIDO -> MERGEADO seria inventar el libro.
const FASE_DEDUCIBLE: Readonly<Record<string, string>> = { ANALIZADO: 'ANALYZE', CADUCADO: 'EXPIRE' } // prettier-ignore

// Todo o nada, DDL incluido: un libro a medias lo saltaria NOT EXISTS para siempre.
const hechas = db.transaction((): number => {
  // Puede correr ANTES del rebuild que crea la tabla: el schema es idempotente.
  db.exec(PROPOSAL_EVENTS_SCHEMA)
  const insert = db.prepare(`INSERT INTO proposal_events (id, proposal_id, seq, phase, event_type,
    from_state, to_state, actor, reason, evidence_json, ts) VALUES (?, ?, ?, ?, 'TRANSITION',
    ?, ?, 'motor', ?, '{"synthetic":true}', ?)`)
  const proposals = db.prepare(`SELECT id, state, analysis_reason, created_at, updated_at
    FROM repair_proposals p
    WHERE NOT EXISTS (SELECT 1 FROM proposal_events e WHERE e.proposal_id = p.id)`).all() as { id: string; state: string; analysis_reason: string | null; created_at: number; updated_at: number }[] // prettier-ignore
  for (const p of proposals) {
    insert.run(crypto.randomUUID(), p.id, 1, 'SELECT', null, 'ELEGIDO', null, p.created_at)
    const phase = FASE_DEDUCIBLE[p.state]
    if (phase !== undefined) insert.run(crypto.randomUUID(), p.id, 2, phase, 'ELEGIDO', p.state, p.analysis_reason, p.updated_at) // prettier-ignore
  }
  return proposals.length
})()

console.log(`COMMIT sobre ${base}. backfilled ${hechas} of ${total} proposals`)
db.close()
