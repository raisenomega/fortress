import type { SendMessageInput, SendMessageOutput } from '@application/chat/send-message-types'
import type { Carpeta } from '@domain/chat/carpeta-de-chat'
import type { ChatMessage, NewChatMessage } from '@domain/chat/chat-message'
import type { MensajeDeHilo } from '@domain/chat/chat-repository'
import type { HiloDeChat, NuevoHilo } from '@domain/chat/hilo-de-chat'
import type { ChatChunk, ChatProgress } from '@domain/chat/chat-stream'
import type { EnvioNegado } from '@domain/chat/envio-negado'
import type { NewProject, Project } from '@domain/project/project'
import type { ProyectoEnVista } from '@domain/project/proyecto-en-vista'
import type { ApiKeyVerdict } from '@domain/settings/api-key-check'
import type { Result } from '@domain/shared/result'
import type { Unsubscribe } from './api-types'

export interface ProjectsApi {
  /** Con `resoluble` calculado en el proceso principal (mira disco y git). */
  list(): Promise<readonly ProyectoEnVista[]>
  add(input: NewProject): Promise<Result<Project>>
  remove(id: string): Promise<Result<null>>
  pickFolder(): Promise<NewProject | null>
  self(): Promise<NewProject | null>
  setTrusted(id: string, trusted: boolean): Promise<Result<null>>
  unblock(id: string): Promise<Result<null>>
}

export interface ChatApi {
  history(projectId: string): Promise<readonly ChatMessage[]>
  append(message: NewChatMessage): Promise<Result<ChatMessage>>
  clear(projectId: string): Promise<void>
  /** `EnvioNegado`: una puerta del main lo paro antes de que el turno existiera. */
  send(input: SendMessageInput): Promise<Result<SendMessageOutput> | EnvioNegado>
  /** Detiene el workflow en marcha. Devuelve procesos terminados. */
  stop(projectId: string): Promise<number>
  onChunk(listener: (chunk: ChatChunk) => void): Unsubscribe
  onProgress(listener: (p: ChatProgress) => void): Unsubscribe
  /** Los HILOS del multi-chat (B1): el puente al cajon de B0. */
  createHilo(nuevo: NuevoHilo): Promise<HiloDeChat>
  listHilos(projectId: string | null): Promise<readonly HiloDeChat[]>
  listByHilo(chatId: string): Promise<readonly ChatMessage[]>
  addToHilo(chatId: string, mensaje: MensajeDeHilo): Promise<ChatMessage>
  /** La barra de carpetas (PASO 116): listas del organizador y el borrado. */
  listarCarpetas(): Promise<readonly Carpeta[]>
  listarSueltos(): Promise<readonly HiloDeChat[]>
  borrarHilo(hiloId: string): Promise<void>
  crearCarpeta(nombre: string): Promise<Carpeta>
  hilosPorCarpeta(carpetaId: string): Promise<readonly HiloDeChat[]>
  /** La gestion del ⋯ (PASO 121). borrarCarpeta 'mover' = SET NULL. */
  renombrarHilo(hiloId: string, titulo: string): Promise<void>
  moverHilo(hiloId: string, carpetaId: string | null): Promise<void>
  renombrarCarpeta(id: string, nombre: string): Promise<void>
  borrarCarpeta(id: string, modo: 'mover' | 'con-hilos'): Promise<void>
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
