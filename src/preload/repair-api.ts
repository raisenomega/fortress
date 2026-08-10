import type { GenerateResult } from '@application/repair/generate-types'
import type { RunGateResult } from '@application/repair/run-gate'
import type { RunOmegaResult } from '@application/repair/run-omega'
import type { Project } from '@domain/project/project'
import type { Proposal } from '@domain/repair/proposal'
import type { ProposalEvent } from '@domain/repair/proposal-event'
import type { Result } from '@domain/shared/result'

/** Motor de reparacion disciplinado: C1 elegir, C2 entender, C3 generar. */
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
  /** El libro de vida de una propuesta, en orden de seq. */
  events(proposalId: string): Promise<readonly ProposalEvent[]>
  /**
   * C3 — genera el fix en un worktree aislado (agente real, puede tardar
   * minutos). Termina en GENERADO o RECHAZADO; jamas toca el arbol vivo.
   */
  generate(proposalId: string): Promise<GenerateResult>
  /**
   * I3 — juicio hermetico del fix (npm ci + typecheck + lint + test:unit
   * DENTRO del worktree; minutos). GATE si verde; RECHAZADO con autopsia.
   */
  runGate(proposalId: string): Promise<RunGateResult>
  /** I4 — juicio semantico independiente. APROBADO -> OMEGA; VETADO -> RECHAZADO. */
  runOmega(proposalId: string): Promise<RunOmegaResult>
}
