import { analyzeCookies } from '@domain/posture/analyze/cookies'
import { analyzeCors } from '@domain/posture/analyze/cors'
import { analyzeDefenses } from '@domain/posture/analyze/defenses'
import { analyzeExposed } from '@domain/posture/analyze/exposed'
import { analyzeHeaders } from '@domain/posture/analyze/headers'
import { analyzeTls } from '@domain/posture/analyze/tls'
import type { PostureFinding } from '@domain/posture/posture-finding'
import type { CheckFamily } from '@domain/posture/scan-depth'
import type { Target } from '@domain/posture/target-url'
import type { Probe } from './http-probe'
import type { PathProbe } from './collect-signals'

export interface Signals {
  readonly root: Probe
  readonly redirectsToHttps: boolean
  readonly paths: readonly PathProbe[]
}

/**
 * Cruza lo observado con los analizadores puros, familia a familia segun la
 * profundidad elegida. La red vive fuera; aqui solo se decide, y por eso todo
 * esto se puede probar sin tocar internet.
 */
export function buildFindings(
  target: Target,
  families: readonly CheckFamily[],
  signals: Signals
): readonly PostureFinding[] {
  const has = (f: CheckFamily): boolean => families.includes(f)
  const out: PostureFinding[] = []

  if (has('headers'))
    out.push(...analyzeHeaders(signals.root.headers), ...analyzeDefenses(signals.root.headers))
  if (has('tls'))
    out.push(...analyzeTls({ https: target.https, redirectsToHttps: signals.redirectsToHttps }))
  if (has('cookies')) out.push(...analyzeCookies(signals.root.setCookies))
  if (has('cors'))
    out.push(...analyzeCors(signals.root.headers['access-control-allow-origin'] ?? null))
  if (has('exposed')) out.push(...analyzeExposed(signals.paths))

  return out
}
