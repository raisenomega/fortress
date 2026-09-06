import type { Database } from 'better-sqlite3'
import { sinSupervivientesDegradadas } from './fase-b-criterio-6.ts'

/**
 * Los criterios que se comprueban DENTRO de la transaccion, antes del commit.
 * Cualquiera que falle lanza, y `better-sqlite3` deshace la transaccion entera:
 * la base queda intacta sin que nadie tenga que restaurar el backup.
 *
 * El backup sigue siendo obligatorio — cubre lo que una transaccion no puede
 * (un kill -9, un disco lleno) y es la unica referencia del criterio 4, que
 * compara `first_seen` fila a fila y solo se puede mirar despues.
 */
export function verificarEnCaliente(
  db: Database,
  proyecto: string,
  exentas: readonly string[]
): void {
  const uno = (sql: string, ...p: unknown[]): number =>
    (db.prepare(sql).get(proyecto, ...p) as { n: number }).n

  // 1 — ninguna viva conserva la identidad de la formula vieja (SEVERIDAD|...).
  const viejas = uno(
    `SELECT COUNT(*) n FROM findings WHERE project_id = ? AND lifecycle != 'EXTINCT'
     AND identity GLOB '[A-Z]*|*'`
  )
  if (viejas > 0) throw new Error(`criterio 1: ${viejas} vivas siguen con identidad vieja`)

  // 2 — ninguna de las reclasificadas se quedo en 'otro'. La CSP obsoleta esta
  // exenta a proposito: no le falta un tipo, le falta juicio, y eso es del motor.
  const huecos = exentas.map(() => '?').join(',')
  const otros = uno(
    `SELECT COUNT(*) n FROM findings WHERE project_id = ? AND lifecycle != 'EXTINCT'
     AND tipo = 'otro' AND id NOT IN (${huecos})`,
    ...exentas
  )
  if (otros > 0) throw new Error(`criterio 2: ${otros} vivas siguen sin tipo`)

  // 3 — ninguna identidad repetida entre vivas: es el estado que 2b viene a cerrar.
  const repes = db
    .prepare(
      `SELECT identity, COUNT(*) n FROM findings WHERE project_id = ? AND lifecycle != 'EXTINCT'
       GROUP BY identity HAVING n > 1`
    )
    .all(proyecto) as { identity: string }[]
  if (repes.length > 0) throw new Error(`criterio 3: identidad repetida — ${repes[0].identity}`)

  // 5 — toda absorbida esta EXTINCT y sin fecha de resolucion: no se resolvio,
  // se fusiono. Una con `resolved_at` afirmaria lo que no paso.
  const malas = (
    db
      .prepare(
        `SELECT COUNT(*) n FROM findings WHERE extinct_reason LIKE 'fusionada-con-%'
         AND (lifecycle != 'EXTINCT' OR resolved_at IS NOT NULL)`
      )
      .get() as { n: number }
  ).n
  if (malas > 0) throw new Error(`criterio 5: ${malas} absorbidas mal marcadas`)

  // 6 — ninguna superviviente por debajo de la maxima de su grupo, en su modulo.
  sinSupervivientesDegradadas(db, proyecto)
}
