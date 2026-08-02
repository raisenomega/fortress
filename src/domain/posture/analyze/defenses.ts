import type { PostureFinding } from '../posture-finding'
import type { Headers } from './headers'

/** Huellas de un WAF o CDN que absorbe volumen y filtra ataques. */
const SHIELD_SIGNALS = ['cf-ray', 'x-cdn', 'x-cache', 'x-sucuri-id', 'x-akamai-transformed']
const RATE_SIGNALS = ['x-ratelimit-limit', 'ratelimit-limit', 'retry-after']

function hasAny(headers: Headers, names: readonly string[]): boolean {
  return names.some((name) => name in headers)
}

/**
 * Comprueba si el sitio tiene puesta la defensa contra justo lo que el escaner
 * NO hace: inundacion (DoS) y ataques automatizados. No prueba la defensa a
 * golpes; mira si existe. Sin WAF ni rate limiting a la vista, una lluvia de
 * peticiones llega directa a tu servidor.
 */
export function analyzeDefenses(headers: Headers): readonly PostureFinding[] {
  const shielded = hasAny(headers, SHIELD_SIGNALS)
  const rateLimited = hasAny(headers, RATE_SIGNALS)

  if (shielded || rateLimited) return []

  return [
    {
      family: 'headers',
      severity: 'MEDIUM',
      title: 'Sin proteccion visible contra inundacion',
      evidence: 'No se ven cabeceras de WAF, CDN ni rate limiting en la respuesta',
      fix:
        'Pon un WAF/CDN (Cloudflare u similar) y rate limiting: es la barrera ' +
        'contra los ataques de volumen que este escaner se niega a lanzar'
    }
  ]
}
