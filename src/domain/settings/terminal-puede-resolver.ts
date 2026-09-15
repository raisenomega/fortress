import { ejecutaConConfianza } from '../repair/confianza'
import type { Project } from '../project/project'

/** Lo que el Terminal necesita saber DEL PROYECTO para poder resolver en el. */
export interface HechosDelProyecto {
  readonly project: Project | null
  /** El proyecto es el propio repo de FORTRESS. */
  readonly selfRepo: boolean
  /** Hay red de reversion (ADR-079). Lo decide la infraestructura: es git. */
  readonly redGit: boolean
}

/**
 * Si el Terminal PODRIA resolver en este proyecto (el lote de ADR-088): la parte
 * POR PROYECTO de `effectiveMode` —confianza, no ser el repo propio, red git—.
 * Deja fuera las dos que no son del proyecto: el modo, que el renderer ya ve, y
 * la palabra de area protegida, que es de cada peticion.
 *
 * No es una regla nueva: un test la ata a `effectiveMode` en las ocho
 * combinaciones. Si una cambia sin la otra, cae, y la casilla del lote no puede
 * ofrecer resolver donde el turno luego degradaria a supervisado.
 */
export function terminalPuedeResolver(hechos: HechosDelProyecto): boolean {
  return ejecutaConConfianza(hechos.project) && !hechos.selfRepo && hechos.redGit
}
