/**
 * Un HILO del chat (PASO 104, B0): el contenedor compartido del multi-chat.
 * `projectId` NULL es el chat LIBRE — conversa sin repo. El `modo` es del
 * hilo, no del mensaje: un hilo nace en una vista y vive en ella.
 */
export type ModoDeChat = 'terminal' | 'libre' | 'plan' | 'investigacion' | 'ejecutor' | 'cto'

export interface HiloDeChat {
  readonly id: string
  readonly projectId: string | null
  readonly titulo: string
  readonly modo: ModoDeChat
  /** Carpeta del organizador de libre (PASO 114); NULL = hilo suelto. */
  readonly carpetaId: string | null
  readonly createdAt: string
  readonly updatedAt: string
}

export interface NuevoHilo {
  readonly projectId: string | null
  readonly titulo: string
  readonly modo: ModoDeChat
  /** Opcional: nacer DENTRO de una carpeta (la activa en la barra). */
  readonly carpetaId?: string | null
}

/** Los modos SIN repo (libre y cto, PASO 133): globales, powers-off — su
 *  seguridad es el candado de la corrida, no el gate de proyecto+confianza
 *  de la vista; y su par es SIEMPRE global (proyecto NULL). */
export const esModoSinRepo = (modo: ModoDeChat): boolean => modo === 'libre' || modo === 'cto'
