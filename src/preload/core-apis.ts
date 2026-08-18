import type { SendMessageInput, SendMessageOutput } from '@application/chat/send-message-types'
import type { ChatMessage, NewChatMessage } from '@domain/chat/chat-message'
import type { ChatChunk, ChatProgress } from '@domain/chat/chat-stream'
import type { LoopSession } from '@domain/loop/loop-session'
import type { LoopStatus } from '@domain/loop/loop-status'
import type { NewProject, Project } from '@domain/project/project'
import type { ApiKeyVerdict } from '@domain/settings/api-key-check'
import type { Result } from '@domain/shared/result'
import type { Unsubscribe } from './api-types'

export interface ProjectsApi {
  list(): Promise<readonly Project[]>
  add(input: NewProject): Promise<Result<Project>>
  remove(id: string): Promise<Result<null>>
  pickFolder(): Promise<NewProject | null>
  self(): Promise<NewProject | null>
  setTrusted(id: string, trusted: boolean): Promise<Result<null>>
  setLoopEnabled(id: string, enabled: boolean): Promise<Result<null>>
}

export interface ChatApi {
  history(projectId: string): Promise<readonly ChatMessage[]>
  append(message: NewChatMessage): Promise<Result<ChatMessage>>
  clear(projectId: string): Promise<void>
  send(input: SendMessageInput): Promise<Result<SendMessageOutput>>
  /** Detiene el workflow en marcha. Devuelve procesos terminados. */
  stop(projectId: string): Promise<number>
  onChunk(listener: (chunk: ChatChunk) => void): Unsubscribe
  onProgress(listener: (p: ChatProgress) => void): Unsubscribe
  /** La sesion de loop guardada del proyecto: dice por que paro la ultima. */
  lastLoopSession(projectId: string): Promise<LoopSession | null>
  onLoopStatus(listener: (status: LoopStatus) => void): Unsubscribe
  onLoopChunk(listener: (chunk: ChatChunk) => void): Unsubscribe
}

export interface SettingsApi {
  get(key: string): Promise<string | null>
  set(key: string, value: string): Promise<void>
  /** La key se valida contra la API, entra cifrada y nunca vuelve al renderer. */
  saveApiKey(plainKey: string): Promise<Result<ApiKeyVerdict>>
  hasApiKey(): Promise<boolean>
  checkApiKey(): Promise<ApiKeyVerdict>
  clearApiKey(): Promise<void>
}
