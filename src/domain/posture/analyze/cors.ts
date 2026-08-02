import type { PostureFinding } from '../posture-finding'

/**
 * Access-Control-Allow-Origin: * deja que cualquier web lea las respuestas de
 * tu API en el navegador de tus usuarios. Es la puerta abierta mas comun.
 */
export function analyzeCors(allowOrigin: string | null): readonly PostureFinding[] {
  if (allowOrigin === null) return []
  if (allowOrigin.trim() !== '*') return []

  return [
    {
      family: 'cors',
      severity: 'MEDIUM',
      title: 'CORS abierto a cualquier origen',
      evidence: 'Access-Control-Allow-Origin: *',
      fix: 'Restringe Access-Control-Allow-Origin a los dominios que de verdad usas'
    }
  ]
}
