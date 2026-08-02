import type { PostureFinding } from '../posture-finding'

/**
 * Rutas que no deberian responder en produccion. La lista es fija y corta a
 * proposito: son GET de lectura sobre archivos conocidos, no un rastreo. Es
 * "que puertas estan abiertas", no forzar ninguna.
 */
export const SENSITIVE_PATHS = [
  '/.env',
  '/.git/config',
  '/.DS_Store',
  '/config.php.bak',
  '/backup.zip',
  '/.well-known/security.txt'
] as const

interface Probe {
  readonly path: string
  readonly status: number
}

/** security.txt al reves: que EXISTA es bueno, es una via de contacto. */
function judge(probe: Probe): PostureFinding | null {
  const alcanzable = probe.status >= 200 && probe.status < 300
  if (!alcanzable) return null

  if (probe.path === '/.well-known/security.txt') return null

  return {
    family: 'exposed',
    severity: probe.path === '/.env' || probe.path.startsWith('/.git') ? 'CRITICAL' : 'HIGH',
    title: `Archivo sensible accesible: ${probe.path}`,
    evidence: `GET ${probe.path} devolvio ${probe.status}`,
    fix: `Bloquea el acceso publico a ${probe.path} en el servidor`
  }
}

export function analyzeExposed(probes: readonly Probe[]): readonly PostureFinding[] {
  return probes.map(judge).filter((f): f is PostureFinding => f !== null)
}
