export const SCAN_DEPTHS = ['baja', 'media', 'alta', 'ultra'] as const

export type ScanDepth = (typeof SCAN_DEPTHS)[number]

export const CHECK_FAMILIES = ['headers', 'tls', 'cookies', 'cors', 'exposed', 'recon'] as const

export type CheckFamily = (typeof CHECK_FAMILIES)[number]

/**
 * Que revisa cada nivel. Mas profundidad = mira MAS sitios, no golpea mas
 * fuerte: todas las familias son lecturas de bajo volumen. La intensidad no
 * existe a proposito; lo que crece es la cobertura.
 */
const BY_DEPTH: Record<ScanDepth, readonly CheckFamily[]> = {
  baja: ['headers', 'tls'],
  media: ['headers', 'tls', 'cookies', 'cors'],
  alta: ['headers', 'tls', 'cookies', 'cors', 'exposed'],
  ultra: ['headers', 'tls', 'cookies', 'cors', 'exposed', 'recon']
}

export function familiesFor(depth: ScanDepth): readonly CheckFamily[] {
  return BY_DEPTH[depth]
}

export const DEPTH_LABEL: Record<ScanDepth, string> = {
  baja: 'Baja · cabeceras y TLS',
  media: 'Media · + cookies y CORS',
  alta: 'Alta · + rutas expuestas',
  ultra: 'Todas · todo de una vez (recomendado)'
}
