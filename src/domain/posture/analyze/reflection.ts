import type { PostureFinding } from '../posture-finding'

export interface ReflectionProbe {
  /** Token unico e inofensivo que se envio en un parametro. */
  readonly token: string
  /** El cuerpo de la respuesta lo devolvio sin escapar. */
  readonly echoedUnescaped: boolean
}

/**
 * Detecta reflexion de input sin explotarla. Se manda un token inofensivo (no
 * ejecutable) y se mira si vuelve tal cual en el HTML. Si vuelve sin escapar,
 * ahi cabe un XSS reflejado; el escaner lo senala pero NUNCA manda una carga
 * que se ejecute. Leer si la puerta cede, no derribarla.
 */
export function analyzeReflection(probe: ReflectionProbe): readonly PostureFinding[] {
  if (!probe.echoedUnescaped) return []

  return [
    {
      family: 'exposed',
      severity: 'HIGH',
      title: 'Input reflejado sin escapar',
      evidence: `El sitio devolvio el texto de prueba "${probe.token}" tal cual en el HTML`,
      fix: 'Escapa toda salida que venga de parametros de usuario; ahi cabe un XSS reflejado'
    }
  ]
}
