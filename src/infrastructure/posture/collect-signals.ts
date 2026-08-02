import { SENSITIVE_PATHS } from '@domain/posture/analyze/exposed'
import type { Target } from '@domain/posture/target-url'
import { probe, type Probe } from './http-probe'

export interface PathProbe {
  readonly path: string
  readonly status: number
}

/** Pausa entre peticiones: el escaner es un vecino educado, no una avalancha. */
const GAP_MS = 400

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function fetchRoot(target: Target): Promise<Probe> {
  return probe(target.url, 'GET')
}

/** Si el sitio es https, ¿la version http redirige? Un 3xx es la respuesta. */
export async function checkHttpRedirect(target: Target): Promise<boolean> {
  if (!target.https) return false
  try {
    const res = await probe(`http://${target.host}`, 'HEAD')
    return res.status >= 300 && res.status < 400
  } catch {
    return false
  }
}

/** Rutas sensibles, una a una y con pausa. Lista fija, GET de lectura. */
export async function probePaths(target: Target): Promise<readonly PathProbe[]> {
  const results: PathProbe[] = []
  for (const path of SENSITIVE_PATHS) {
    try {
      const res = await probe(`${target.url}${path}`, 'GET')
      results.push({ path, status: res.status })
    } catch {
      results.push({ path, status: 0 })
    }
    await wait(GAP_MS)
  }
  return results
}
