import type { AgentHealth } from '@domain/omega/agent-health'
import type { OmegaAuditReport } from '@domain/omega/audit-report'
import type { FileSnippet } from '@domain/omega/filesystem-probe'
import type { OmegaEntry } from '@domain/omega/omega-entry'
import type { OmegaScore } from '@domain/omega/omega-score'
import type { Result } from '@domain/shared/result'
import type { AgentRun } from '@domain/telemetry/agent-run'

/** Contrato de SENTINEL OMEGA en el puente. Auditar, leer y medir; jamas borrar. */
export interface OmegaApi {
  /** OMEGA verifica los hallazgos contra el disco y escribe en el Libro de la Vida. */
  audit(projectId: string): Promise<Result<OmegaAuditReport>>
  /** Lee el Libro de la Vida del proyecto. Solo lectura: nunca se borra. */
  list(projectId: string): Promise<readonly OmegaEntry[]>
  /** Puntuacion de integridad con datos reales (veracidad, cumplimiento). */
  score(projectId: string): Promise<Result<OmegaScore>>
  /** Salud real de cada agente en el proyecto (vista macro). */
  agents(projectId: string): Promise<readonly AgentHealth[]>
  /** Ejecuciones recientes del proyecto (perfil micro por agente). */
  runs(projectId: string): Promise<readonly AgentRun[]>
  /** Ejecuciones de un agente cruzando proyectos (su pagina dedicada). */
  agentRuns(agentId: string): Promise<readonly AgentRun[]>
  /** Codigo real alrededor de una linea: la evidencia que OMEGA cita. */
  snippet(projectId: string, file: string, line: number): Promise<Result<FileSnippet>>
}
