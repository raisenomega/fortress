/**
 * Un HILO del chat (PASO 104, B0): el contenedor compartido del multi-chat.
 * `projectId` NULL es el chat LIBRE — conversa sin repo. El `modo` es del
 * hilo, no del mensaje: un hilo nace en una vista y vive en ella.
 */
export type ModoDeChat = 'terminal' | 'libre' | 'plan' | 'investigacion' | 'ejecutor'

export interface HiloDeChat {
  readonly id: string
  readonly projectId: string | null
  readonly titulo: string
  readonly modo: ModoDeChat
  readonly createdAt: string
  readonly updatedAt: string
}

export interface NuevoHilo {
  readonly projectId: string | null
  readonly titulo: string
  readonly modo: ModoDeChat
}
