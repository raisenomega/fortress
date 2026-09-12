import type { ScanSummary } from '@application/scan/scan-types'
import type { AgentId } from '@domain/agent/agent'
import type { Finding } from '@domain/project/project'
import type { FindingHistoria } from '@domain/project/finding-historia'
import type { SeverityCounts } from '@domain/project/severity-counts'
import type { ScanChunk } from '@domain/scan/scan-chunk'
import type { ScanRecord } from '@domain/scan/scan-record'
import type { IntegralScore } from '@domain/score/integral-score'
import type { Result } from '@domain/shared/result'
import type { AgentStats } from '@application/telemetry/build-agent-stats'
import type { Activity } from '@domain/telemetry/activity'
import type { Unsubscribe } from './api-types'

export interface ScanApi {
  /** Audita la seguridad del proyecto en disco. Puede tardar minutos. */
  run(projectId: string): Promise<Result<ScanSummary>>
  findings(projectId: string): Promise<readonly Finding[]>
  /** Lo CERRADO, que `findings` no trae: la historia del proyecto (ADR-087). */
  historia(projectId: string): Promise<readonly FindingHistoria[]>
  /** Conteos de todos los proyectos a la vez, para las tarjetas. */
  counts(): Promise<Readonly<Record<string, SeverityCounts>>>
  onProgress(listener: (chunk: ScanChunk) => void): Unsubscribe
  /** Detener: la parada en curso termina, la siguiente no arranca. Devuelve
   *  cuantos procesos hijos se cortaron. */
  stop(projectId: string): Promise<number>
  /** Escaneos anteriores, del mas reciente al mas antiguo. */
  history(projectId: string, limit: number): Promise<readonly ScanRecord[]>
  /** Escaneos de todos los proyectos desde una fecha, para la tendencia. */
  historySince(iso: string): Promise<readonly ScanRecord[]>
  /** Marca un hallazgo como falso positivo: deja de contar y de bloquear. */
  dismiss(findingId: string): Promise<Result<null>>
  reopen(findingId: string): Promise<Result<null>>
  /** El operador declara que ya lo arreglo, con una nota (normalmente el sha). */
  mitigate(findingId: string, note: string): Promise<Result<null>>
  /** Deshace la marca de arreglado: vuelve a la cola. */
  unmitigate(findingId: string): Promise<Result<null>>
}

export interface ActivityApi {
  /** Timeline del proyecto, de lo mas reciente a lo mas antiguo. */
  byProject(projectId: string, limit: number): Promise<readonly Activity[]>
  /** Historial de un agente; projectId en null son todos los proyectos. */
  byAgent(agentId: AgentId, projectId: string | null, limit: number): Promise<readonly Activity[]>
  /** Todo lo que el panel de un agente necesita, en una llamada. */
  stats(agentId: AgentId, projectId: string): Promise<AgentStats>
}

export interface PushApi {
  /** Rechazado si el proyecto tiene CRITICAL o no se ha escaneado. */
  run(projectId: string): Promise<Result<string>>
}

export interface QualityApi {
  /**
   * Audita las 6 dimensiones (Seguridad reusa el ultimo escaneo; el resto corre
   * probes en proyectos de confianza). Puede tardar minutos; no congela la UI.
   */
  run(projectId: string): Promise<Result<IntegralScore>>
}
