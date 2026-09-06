import type { Database } from 'better-sqlite3'
import { porDebajoDeSuGrupo } from '../src/domain/project/severidad-al-fundir.ts'
import { masUrgente, type Severity } from '../src/domain/shared/severity.ts'

/** Cada superviviente VIVA junto a la severidad de una absorbida suya. La
 *  absorbida dice de quien es por `extinct_reason`, que es donde quedo escrito. */
const PAREJAS = `SELECT g.id, g.severity AS viva, a.severity AS absorbida
  FROM findings g JOIN findings a ON a.extinct_reason = 'fusionada-con-' || g.id
  WHERE g.project_id = ? AND g.lifecycle != 'EXTINCT'`

interface Pareja {
  readonly id: string
  readonly viva: Severity
  readonly absorbida: Severity
}

/**
 * Criterio 6: ninguna superviviente por debajo de la maxima de su grupo.
 *
 * Fundir puede SUBIR la gravedad o dejarla igual; bajarla es el defecto que esta
 * red cierra. Existe porque la severidad no entra ni en la identidad ni en el
 * desempate, asi que nada impedia que la fila mas antigua —la que gana— se
 * quedara con la mas suave y se llevara por delante un HIGH. Paso dos veces el
 * 24 de agosto, sobre el propio tablero de FORTRESS.
 *
 * Usa la MISMA regla que la fusion (`porDebajoDeSuGrupo` + `masUrgente`): si un
 * dia dejaran de coincidir, la red dejaria de medir lo que la fusion hace.
 */
export function sinSupervivientesDegradadas(db: Database, proyecto: string): void {
  const porGanadora = new Map<string, { viva: Severity; grupo: Severity[] }>()
  for (const p of db.prepare(PAREJAS).all(proyecto) as Pareja[]) {
    const g = porGanadora.get(p.id) ?? { viva: p.viva, grupo: [] }
    g.grupo.push(p.absorbida)
    porGanadora.set(p.id, g)
  }

  for (const [id, g] of porGanadora) {
    if (porDebajoDeSuGrupo(g.viva, g.grupo, masUrgente)) {
      throw new Error(`criterio 6: ${id} quedo en ${g.viva}, por debajo de su grupo`)
    }
  }
}
