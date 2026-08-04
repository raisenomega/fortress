import type { FolderPlan } from '@application/newproject/prepare-folder'
import type { CognitionSnapshot } from '@domain/cognition/cognition-log'
import type { GraphStatus } from '@domain/graph/graph-status'
import type { NewProjectDraft } from '@domain/newproject/new-project-draft'
import type { Result } from '@domain/shared/result'
import type { AgentRanking } from '@domain/telemetry/agent-run'
import type { PostureRequest, PostureResult } from '@domain/posture/posture-scan'
import type { Account } from '@domain/settings/account'
import type { Billing } from '@domain/telemetry/billing-mode'
import type { Unsubscribe } from './api-types'
import type { MeasuredRun } from '@domain/workflow/workflow-estimate'
import type { TokenUsage } from '@domain/telemetry/token-usage'

/** Contratos que no cuelgan de un escaneo: telemetria, cerebro y sistema. */
export interface TelemetryApi {
  /** Suscripcion o API key: decide si el coste es real o equivalente. */
  billing(): Promise<Billing>
  /** Media real por ejecucion en un proyecto. Null si no hay historial. */
  averageRun(projectId: string): Promise<MeasuredRun | null>
  /** Consumo desde que arranco la app. */
  session(): Promise<TokenUsage>
  since(iso: string): Promise<TokenUsage>
  byProject(iso: string): Promise<Readonly<Record<string, TokenUsage>>>
  ranking(iso: string, limit: number): Promise<readonly AgentRanking[]>
}

export interface CognitionApi {
  /** COGNITION-LOG.md del proyecto, ya parseado. Vacio si no existe. */
  read(projectId: string): Promise<CognitionSnapshot>
}

export interface GraphApi {
  /** Solo detecta si el grafo esta configurado; no lee sus datos. */
  status(projectId: string): Promise<GraphStatus>
}

export interface MaintenanceApi {
  /** Procesos `claude` vivos ahora mismo. */
  liveJobs(): Promise<number>
  /** Los termina, vacia la cache y recarga. La base de datos no se toca. */
  cleanup(): Promise<{ readonly killed: number }>
}

export interface HomeDir {
  readonly label: string
  readonly path: string
}

export interface NewProjectApi {
  /** Atajos a Escritorio, Documentos y la carpeta personal. */
  homeDirs(): Promise<readonly HomeDir[]>
  /** Que ruta saldria, y que hay dentro si ya existe. No crea nada. */
  planFolder(draft: NewProjectDraft): Promise<Result<FolderPlan>>
  createFolder(draft: NewProjectDraft, useExisting: boolean): Promise<Result<string>>
}

export interface AccountApi {
  /** Cuenta con la que `claude` esta conectado, si lo esta. */
  status(): Promise<Account>
  login(): Promise<void>
  onOutput(listener: (text: string) => void): Unsubscribe
}

export interface PostureApi {
  /** Audita la exposicion externa de un sitio propio. Solo lectura. */
  run(request: PostureRequest): Promise<Result<PostureResult>>
}

