import type { SendMessageInput, SendMessageOutput } from '@application/chat/send-message-types'
import type { ChatMessage, NewChatMessage } from '@domain/chat/chat-message'
import type { ChatChunk } from '@domain/chat/chat-stream'
import type { ScanSummary } from '@application/scan/scan-types'
import type { HealthReport } from '@domain/health/health-check'
import type { Finding, NewProject, Project } from '@domain/project/project'
import type { SeverityCounts } from '@domain/project/severity-counts'
import type { ScanChunk } from '@domain/scan/scan-chunk'
import type { ApiKeyVerdict } from '@domain/settings/api-key-check'
import type { Result } from '@domain/shared/result'

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
  }
  readonly chat: {
    history(projectId: string): Promise<readonly ChatMessage[]>
    append(message: NewChatMessage): Promise<Result<ChatMessage>>
    clear(projectId: string): Promise<void>
    send(input: SendMessageInput): Promise<Result<SendMessageOutput>>
    onChunk(listener: (chunk: ChatChunk) => void): Unsubscribe
  }
  readonly health: {
    /** Diagnostico completo del sistema. */
    run(): Promise<HealthReport>
  }
  readonly scan: {
    /** Audita la seguridad del proyecto en disco. Puede tardar minutos. */
    run(projectId: string): Promise<Result<ScanSummary>>
    findings(projectId: string): Promise<readonly Finding[]>
    /** Conteos de todos los proyectos a la vez, para las tarjetas. */
    counts(): Promise<Readonly<Record<string, SeverityCounts>>>
    onProgress(listener: (chunk: ScanChunk) => void): Unsubscribe
  }
  readonly push: {
    /** Rechazado si el proyecto tiene CRITICAL o no se ha escaneado. */
    run(projectId: string): Promise<Result<string>>
  }
  readonly settings: {
    get(key: string): Promise<string | null>
    set(key: string, value: string): Promise<void>
    /** La key se valida contra la API, entra cifrada y nunca vuelve al renderer. */
    saveApiKey(plainKey: string): Promise<Result<ApiKeyVerdict>>
    hasApiKey(): Promise<boolean>
    /** Revalida la key ya guardada sin exponerla. */
    checkApiKey(): Promise<ApiKeyVerdict>
    clearApiKey(): Promise<void>
  }
}
