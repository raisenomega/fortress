import type { GenerateResult } from '@application/repair/generate-types'
import type { RetryResult } from '@application/repair/retry-repair'
import type { RunGateResult } from '@application/repair/run-gate'
import type { AutoMergeResult } from '@application/repair/auto-merge-types'
import type { DrenajeResultado } from '@application/repair/drenar-hasta-omega'
import type { ResumenCerco } from '@application/repair/resumen-cerco'
import type { JuicioConIntegracion } from '@application/repair/juicio-con-integracion'
import type { Proposal } from '@domain/repair/proposal'
import type { ProposalEvent } from '@domain/repair/proposal-event'
import type { Result } from '@domain/shared/result'
import type { Unsubscribe } from './api-types'
import type { VerificacionApi } from './repair-verificacion-api'

/** Motor de reparacion disciplinado: C1 elegir, C2 entender, C3 generar. */
export interface RepairApi extends VerificacionApi {
  /**
   * C1 elige el hallazgo mas contenido y C2 lo analiza con un agente real
   * (solo lectura, puede tardar). null si no hay candidato elegible. NO
   * genera fix ni toca el arbol.
   *
   * Con `findingId` no elige: atiende ESE hallazgo, quepa o no en el cerco de
   * integracion automatica. null si ya tiene propuesta viva, si no esta activo
   * o si su severidad cae fuera del estreno del motor.
   */
  propose(projectId: string, findingId?: string): Promise<Result<Proposal | null>>
  /** Expediente del proyecto, del mas reciente al mas antiguo. */
  list(projectId: string): Promise<readonly Proposal[]>
  /** Cuantos hallazgos vivos quedan fuera del cerco: la cola no los elige sola. */
  cerco(projectId: string): Promise<ResumenCerco>
  get(id: string): Promise<Proposal | null>
  /** El libro de vida de una propuesta, en orden de seq. */
  events(proposalId: string): Promise<readonly ProposalEvent[]>
  /** Avisa de que el expediente de ese proyecto se movio. Devuelve como desuscribirse. */
  onChanged(listener: (projectId: string) => void): Unsubscribe
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
  runOmega(proposalId: string): Promise<JuicioConIntegracion>
  /**
   * La FIRMA: integra una propuesta que OMEGA ya aprobo. No pasa por el cerco
   * —ese decide la integracion sin firma— pero no alcanza los archivos que
   * gobiernan la autonomia.
   */
  sign(proposalId: string): Promise<AutoMergeResult>
  /**
   * Recorre los hallazgos elegibles dejando cada fix juzgado y esperando firma.
   * Tarda minutos y no escribe al chat: el avance se ve en la cola de firma.
   */
  drain(projectId: string): Promise<DrenajeResultado>
  /** Detiene el drenaje en curso. Una parada no es un fallo. */
  drainStop(projectId: string): Promise<number>
  /**
   * I4.2 — reintento explicito de un RECHAZADO de razonamiento (D24):
   * propuesta NUEVA sobre el HEAD actual con C2 fresco; la vieja no se muta.
   */
  retry(proposalId: string): Promise<RetryResult>
  /**
   * Retira una propuesta viva: la CADUCA con el motivo del operador y la saca
   * de la cola, liberando su hallazgo. No existe deshacer — el libro conserva
   * la historia entera, pero la propuesta ya no vuelve.
   */
  withdraw(proposalId: string, motivo?: string): Promise<Result<null>>
}
