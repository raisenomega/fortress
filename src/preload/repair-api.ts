import type { Project } from '@domain/project/project'
import type { Proposal } from '@domain/repair/proposal'
import type { Result } from '@domain/shared/result'

/** Motor de reparacion disciplinado. En I1 solo C1 (elegir) + C2 (entender). */
export interface RepairApi {
  /**
   * El proyecto registrado que ES el propio repo de FORTRESS, resuelto en el
   * main (funciona tambien empaquetado, donde projects.self() es null).
   */
  self(): Promise<Project | null>
  /**
   * C1 elige el hallazgo mas contenido y C2 lo analiza con un agente real
   * (solo lectura, puede tardar). null si no hay candidato elegible. NO
   * genera fix ni toca el arbol.
   */
  propose(projectId: string): Promise<Result<Proposal | null>>
  /** Expediente del proyecto, del mas reciente al mas antiguo. */
  list(projectId: string): Promise<readonly Proposal[]>
  get(id: string): Promise<Proposal | null>
}
