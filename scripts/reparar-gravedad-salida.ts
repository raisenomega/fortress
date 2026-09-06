import type { Database } from 'better-sqlite3'
import type { Degradada } from '../src/domain/project/severidad-al-fundir.ts'
import { updatesParaElOperador } from '../src/infrastructure/persistence/reparar-gravedad.ts'

/** El estreno del motor cubre LOW y MEDIUM (ADR-007): subir por encima saca al
 *  hallazgo de la cola y lo manda a firma humana. Es correcto, y hay que decirlo. */
const ESTRENO = ['LOW', 'MEDIUM']

const DETALLE = `SELECT id, file, line, title, lifecycle, status FROM findings WHERE id = ?`

interface Detalle {
  readonly file: string
  readonly line: number | null
  readonly title: string
  readonly lifecycle: string
  readonly status: string
}

/** Una victima, con lo que hace falta para APROBAR el gesto: donde vive, que
 *  dice, en que estado esta y que cambia de regimen al subirla. */
function bloque(db: Database, v: Degradada): readonly string[] {
  const d = db.prepare(DETALLE).get(v.id) as Detalle
  const sale = ESTRENO.includes(v.viva) && !ESTRENO.includes(v.maxima)
  return [
    `  ${d.file}:${d.line ?? '-'}`,
    `    ${v.id}`,
    `    ${v.viva}  ->  ${v.maxima}      lifecycle=${d.lifecycle} status=${d.status}`,
    `    ${d.title.length <= 74 ? d.title : `${d.title.slice(0, 73)}…`}`,
    ...(sale ? ['    AVISO: sale del alcance de estreno (ADR-007) — pasa a exigir firma humana'] : []), // prettier-ignore
    ''
  ]
}

export function salidaDelPlan(
  db: Database,
  proyecto: string,
  victimas: readonly Degradada[]
): readonly string[] {
  const salen = victimas.filter((v) => ESTRENO.includes(v.viva) && !ESTRENO.includes(v.maxima))
  return [
    `PLAN (solo lectura) · proyecto=${proyecto}`,
    'Este script NO escribe: la reparacion es un gesto del operador.',
    '',
    ...victimas.flatMap((v) => bloque(db, v)),
    `TOTAL: ${victimas.length} superviviente(s) por debajo de su grupo`,
    `ALCANCE: ${salen.length} saldria(n) del estreno del motor y pasaria(n) a firma humana`,
    '',
    ...updatesParaElOperador(victimas)
  ]
}
