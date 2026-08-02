import type { ScanSummary } from '@application/scan/scan-types'
import type { AgentId } from '@domain/agent/agent'
import type { Finding } from '@domain/project/project'
import type { SeverityCounts } from '@domain/project/severity-counts'
import type { ScanChunk } from '@domain/scan/scan-chunk'
import type { ScanRecord } from '@domain/scan/scan-record'
import type { Result } from '@domain/shared/result'
import type { AgentStats } from '@application/telemetry/build-agent-stats'
import type { Activity } from '@domain/telemetry/activity'
import type { Unsubscribe } from './api-types'

export interface ScanApi {
  /** Audita la seguridad del proyecto en disco. Puede tardar minutos. */
  run(projectId: string): Promise<Result<ScanSummary>>
  findings(projectId: string): Promise<readonly Finding[]>
  /** Conteos de todos los proyectos a la vez, para las tarjetas. */
  counts(): Promise<Readonly<Record<string, SeverityCounts>>>
  onProgress(listener: (chunk: ScanChunk) => void): Unsubscribe
  /** Escaneos anteriores, del mas reciente al mas antiguo. */
  history(projectId: string, limit: number): Promise<readonly ScanRecord[]>
  /** Escaneos de todos los proyectos desde una fecha, para la tendencia. */
  historySince(iso: string): Promise<readonly ScanRecord[]>
  /** Marca un hallazgo como falso positivo: deja de contar y de bloquear. */
  dismiss(findingId: string): Promise<Result<null>>
  reopen(findingId: string): Promise<Result<null>>
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
