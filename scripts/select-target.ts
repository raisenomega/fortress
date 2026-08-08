import Database from 'better-sqlite3'
import { homedir } from 'os'
import { join } from 'path'
import {
  isDebutEligible,
  selectTarget,
  surface,
  type Candidate
} from '../src/domain/repair/select-target'

// C1 runner: lee los hallazgos reales del self-audit de FORTRESS y ELIGE (read-only).
const db = new Database(join(homedir(), '.config/fortress-command-center/fortress.db'), {
  readonly: true
})
const p = db.prepare("SELECT id FROM projects WHERE name = 'fortress-command-center'").get() as {
  id: string
}
const rows = db
  .prepare(
    "SELECT id, severity, title, file, line FROM findings WHERE project_id = ? AND status = 'open'"
  )
  .all(p.id) as Candidate[]

const elegibles = rows.filter(isDebutEligible)
console.log(`hallazgos abiertos: ${rows.length} | elegibles (LOW/MEDIUM): ${elegibles.length}`)
const sel = selectTarget(rows)
if (!sel) {
  console.log('sin hallazgos elegibles para estrenar')
} else {
  console.log('\n=== C1 · SELECCION (determinista, sin tocar codigo) ===')
  console.log(`ELEGIDO:   ${sel.target.file}:${sel.target.line}  [${sel.target.severity}]`)
  console.log(`superficie: ${surface(sel.target)} (menor = mas contenido)`)
  console.log(`JUSTIFICACION: ${sel.reason}`)
  console.log('\ndescartados (elegibles de mayor superficie):')
  for (const r of elegibles
    .filter((r) => r.id !== sel.target.id)
    .sort((a, b) => surface(a) - surface(b))) {
    console.log(`  - [${r.severity}] ${r.file}:${r.line}  superficie ${surface(r)}`)
  }
}
