import type { Database } from 'better-sqlite3'
import { supervivientesDegradadas, type Pareja } from '../src/domain/project/severidad-al-fundir.ts' // prettier-ignore
import { masUrgente } from '../src/domain/shared/severity.ts'

/** Cada superviviente VIVA junto a la severidad de una absorbida suya. La
 *  absorbida dice de quien es por `extinct_reason`, que es donde quedo escrito. */
const PAREJAS = `SELECT g.id, g.severity AS viva, a.severity AS absorbida
  FROM findings g JOIN findings a ON a.extinct_reason = 'fusionada-con-' || g.id
  WHERE g.project_id = ? AND g.lifecycle != 'EXTINCT'`

/**
 * Criterio 6: ninguna superviviente por debajo de la maxima de su grupo.
 *
 * Fundir puede SUBIR la gravedad o dejarla igual; bajarla es el defecto que esta
 * red cierra —paso dos veces el 24 de agosto sobre el propio tablero—.
 *
 * CASCARA DELGADA a proposito: aqui solo viven la consulta y el `throw`. Quien
 * DECIDE es `supervivientesDegradadas`, en el dominio, donde el gate la prueba;
 * `scripts/` queda fuera del `include` de vitest, asi que todo lo que se pueda
 * equivocar tiene que estar del otro lado de esa frontera.
 */
export function sinSupervivientesDegradadas(db: Database, proyecto: string): void {
  const parejas = db.prepare(PAREJAS).all(proyecto) as Pareja[]
  const degradadas = supervivientesDegradadas(parejas, masUrgente)
  if (degradadas.length === 0) return

  const [d] = degradadas
  throw new Error(
    `criterio 6: ${degradadas.length} superviviente(s) por debajo de su grupo — ` +
      `${d.id} quedo en ${d.viva} y su grupo llega a ${d.maxima}`
  )
}
