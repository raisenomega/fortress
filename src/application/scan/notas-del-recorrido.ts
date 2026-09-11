import type { Project } from '@domain/project/project'
import type { SelfNoteDraft } from '@domain/system/self-observation'
import type { AppContext } from '../context'
import { asentarNotas } from '../system/asentar-notas'

/**
 * Las observaciones de las N paradas, juntas hasta el final del recorrido
 * (ADR-085).
 *
 * Existe por UNA razon aritmetica: el escaner corre una vez POR PARADA —doce en
 * el recorrido de Health Flow— y las doce se topan con el mismo limite de
 * FORTRESS. Asentar parada a parada meteria doce filas diciendo lo mismo; solo
 * viendolas JUNTAS se pueden fundir, y eso lo hace `asentarNotas`.
 *
 * Se vuelca en las TRES salidas del recorrido —completo, abortado y fallo—
 * porque un limite del que el escaner se topo vale igual aunque el operador
 * parase o la maquina reventara despues. Misma doctrina que el analista: «se
 * guarda pase lo que pase con el hallazgo».
 */
export function notasDelRecorrido(
  context: AppContext,
  project: Project
): {
  suma: (notas: readonly SelfNoteDraft[]) => void
  volcar: () => void
} {
  const acumuladas: SelfNoteDraft[] = []

  return {
    suma: (notas) => acumuladas.push(...notas),
    volcar: () => void asentarNotas(context, project, acumuladas)
  }
}
