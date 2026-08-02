export const AUTH_SOURCES = ['suscripcion', 'api-key'] as const

export type AuthSource = (typeof AUTH_SOURCES)[number]

/**
 * Con que credenciales ejecuta FORTRESS los agentes.
 *
 * Por defecto la suscripcion. Es lo que ya usa `claude` en la terminal y no
 * cuesta dinero aparte; la API key es la alternativa para quien no tenga plan
 * o quiera facturar por separado. Al reves, que era como estaba, cualquiera
 * que pegara una key se quedaba pagando sin enterarse.
 */
export const DEFAULT_AUTH_SOURCE: AuthSource = 'suscripcion'

export function parseAuthSource(raw: string | null): AuthSource {
  return raw === 'api-key' ? 'api-key' : DEFAULT_AUTH_SOURCE
}

export const AUTH_LABEL: Record<AuthSource, string> = {
  suscripcion: 'Mi cuenta de Claude',
  'api-key': 'API key propia'
}

export const AUTH_HINT: Record<AuthSource, string> = {
  suscripcion: 'Usa la sesion de Claude Code. Consume cuota de tu plan, no dinero.',
  'api-key': 'Factura cada ejecucion a tu clave y aparece en la consola de Anthropic.'
}
