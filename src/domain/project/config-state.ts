export const CONFIG_STATES = ['PENDIENTE_CONFIGURACION', 'CONFIGURADO'] as const

export type ConfigState = (typeof CONFIG_STATES)[number]

export function isConfigState(value: unknown): value is ConfigState {
  return typeof value === 'string' && (CONFIG_STATES as readonly string[]).includes(value)
}

/**
 * Un proyecto recien creado nace PENDIENTE: el chat solo hace configuracion
 * (entrevista + docs de gobierno) hasta que su marco queda aprobado y escrito.
 * Los proyectos conectados y los ya existentes nacen CONFIGURADO.
 */
export function isPending(state: ConfigState): boolean {
  return state === 'PENDIENTE_CONFIGURACION'
}

export const CONFIG_LABEL: Record<ConfigState, string> = {
  PENDIENTE_CONFIGURACION: 'Proyecto nuevo · vacío',
  CONFIGURADO: 'Configurado'
}
