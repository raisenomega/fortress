import type { PostureFinding } from '../posture-finding'

export interface TlsSignal {
  readonly https: boolean
  /** http:// redirige a https://. */
  readonly redirectsToHttps: boolean
}

/**
 * Sin HTTPS todo lo demas da igual: el trafico viaja en claro. Y HTTPS sin
 * redirigir el http deja una puerta abierta que casi nadie mira.
 */
export function analyzeTls(signal: TlsSignal): readonly PostureFinding[] {
  if (!signal.https) {
    return [
      {
        family: 'tls',
        severity: 'CRITICAL',
        title: 'El sitio no usa HTTPS',
        evidence: 'La direccion responde por http:// sin cifrar',
        fix: 'Instala un certificado TLS y sirve todo por https'
      }
    ]
  }

  if (!signal.redirectsToHttps) {
    return [
      {
        family: 'tls',
        severity: 'MEDIUM',
        title: 'http:// no redirige a https://',
        evidence: 'La version sin cifrar sigue respondiendo en vez de redirigir',
        fix: 'Redirige todo el trafico http a https con un 301'
      }
    ]
  }

  return []
}
