import type { SendMessageInput, SendMessageOutput } from '@application/chat/send-message-types'
import type { ChatMessage, NewChatMessage } from '@domain/chat/chat-message'
import type { ChatChunk, ChatProgress } from '@domain/chat/chat-stream'
import type { HealthReport } from '@domain/health/health-check'
import type { NewProject, Project } from '@domain/project/project'
import type { ApiKeyVerdict } from '@domain/settings/api-key-check'
import type { Result } from '@domain/shared/result'
import type { ActivityApi, PushApi, ScanApi } from './scan-api'
import type { ConnectorsApi } from './connectors-api'
import type { OmegaApi } from './omega-api'
import type {
  AccountApi,
  PostureApi,
  CognitionApi,
  GraphApi,
  MaintenanceApi,
  NewProjectApi,
  TelemetryApi
} from './system-api'

/** Cancela la suscripcion a los fragmentos del streaming. */
export type Unsubscribe = () => void

/**
 * Contrato del puente main <-> renderer. Solo tipos: este modulo no aporta
 * codigo en runtime, por eso el renderer puede importarlo sin arrastrar
 * nada del proceso principal.
 */
export interface FortressApi {
  readonly projects: {
    list(): Promise<readonly Project[]>
    add(input: NewProject): Promise<Result<Project>>
    remove(id: string): Promise<Result<null>>
    /** Abre el selector nativo; null si el operador cancela. */
    pickFolder(): Promise<NewProject | null>
    /** FORTRESS como proyecto; null si el codigo fuente no esta en disco. */
    self(): Promise<NewProject | null>
    setTrusted(id: string, trusted: boolean): Promise<Result<null>>
  }
  readonly chat: {
    history(projectId: string): Promise<readonly ChatMessage[]>
    append(message: NewChatMessage): Promise<Result<ChatMessage>>
    clear(projectId: string): Promise<void>
    send(input: SendMessageInput): Promise<Result<SendMessageOutput>>
    /** Detiene el workflow en marcha. Devuelve procesos terminados. */
    stop(projectId: string): Promise<number>
    onChunk(listener: (chunk: ChatChunk) => void): Unsubscribe
    /** Avance del workflow: agentes, tokens y coste en vivo. */
    onProgress(listener: (p: ChatProgress) => void): Unsubscribe
  }
  readonly health: {
    run(): Promise<HealthReport>
  }
  readonly omega: OmegaApi
  readonly scan: ScanApi
  readonly activity: ActivityApi
  readonly telemetry: TelemetryApi
  readonly account: AccountApi
  readonly posture: PostureApi
  readonly connectors: ConnectorsApi
  readonly cognition: CognitionApi
  readonly graph: GraphApi
  readonly maintenance: MaintenanceApi
  readonly newProject: NewProjectApi
  readonly push: PushApi
  readonly settings: {
    get(key: string): Promise<string | null>
    set(key: string, value: string): Promise<void>
    /** La key se valida contra la API, entra cifrada y nunca vuelve al renderer. */
    saveApiKey(plainKey: string): Promise<Result<ApiKeyVerdict>>
    hasApiKey(): Promise<boolean>
    checkApiKey(): Promise<ApiKeyVerdict>
    clearApiKey(): Promise<void>
  }
}
