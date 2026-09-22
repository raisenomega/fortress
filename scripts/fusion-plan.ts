import Database from 'better-sqlite3'
import { homedir } from 'os'
import { join } from 'path'
import { tipoDeLaIdentidad } from '../src/domain/project/finding-identity.ts'
import { planDeFusion } from '../src/domain/project/fusion-de-duplicados.ts'
import { informeDeFusion, type FilaDelInforme } from '../src/domain/project/informe-de-fusion.ts'
import { isSeverity, masUrgente } from '../src/domain/shared/severity.ts'
import { salidaDelPlan } from './fusion-plan-salida.ts'

/**
 * MODO PLAN de la fusion de duplicados: calcula lo que `planDeFusion` haria
 * sobre un proyecto y lo IMPRIME. No escribe una sola fila.
 *
 * Existe porque la fusion es irreversible en la practica —la absorbida queda
 * EXTINCT y sale del tablero— y hasta hoy la unica forma de ver el plan era
 * ejecutarlo sobre una copia de la base. Aqui el plan se mira antes, sobre la
 * base real, sin tocarla: la conexion se abre `readonly` y no hay transaccion.
 *
 * El proyecto va por argumento y NO tiene defecto: fundir el proyecto
 * equivocado por olvidar un parametro es justo lo que no puede pasar.
 *
 * Uso:  node scripts/fusion-plan.ts <proyecto> [ruta-de-la-base]
 */
interface Row {
  readonly id: string
  readonly identity: string
  readonly first_seen: string
  readonly severity: string
  readonly title: string
}

const VIVAS = `SELECT id, identity, first_seen, severity, title FROM findings
  WHERE project_id = ? AND status = 'open' AND lifecycle = 'ACTIVE'
  ORDER BY first_seen`

const proyecto = process.argv[2]
if (proyecto === undefined) {
  console.error('Falta el proyecto: node scripts/fusion-plan.ts <proyecto> [ruta-de-la-base]')
  process.exit(2)
}

const ruta = process.argv[3] ?? join(homedir(), '.config/fortress-command-center/fortress.db')
const db = new Database(ruta, { readonly: true })
const fila = db.prepare('SELECT id FROM projects WHERE name = ?').get(proyecto) as
  { id: string } | undefined

if (fila === undefined) {
  console.error(`No hay ningun proyecto llamado "${proyecto}" en ${ruta}`)
  process.exit(2)
}

const filas: FilaDelInforme[] = (db.prepare(VIVAS).all(fila.id) as Row[]).map((r) => ({
  id: r.id,
  identidad: r.identity,
  firstSeen: r.first_seen,
  severity: isSeverity(r.severity) ? r.severity : 'MEDIUM',
  title: r.title
}))

const sinClasificar = filas.filter((f) => tipoDeLaIdentidad(f.identidad) === null).length
const grupos = informeDeFusion(filas, planDeFusion(filas), masUrgente)

for (const linea of salidaDelPlan(proyecto, filas.length, sinClasificar, grupos)) {
  console.log(linea)
}
db.close()
