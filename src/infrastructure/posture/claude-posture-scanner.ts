import { postureScore } from '@domain/posture/posture-score'
import type { PostureResult } from '@domain/posture/posture-scan'
import type { PostureScanner } from '@domain/posture/posture-scanner'
import { nowIso } from '@domain/shared/id'
import { buildFindings } from './build-findings'
import { checkHttpRedirect, fetchRoot, probePaths } from './collect-signals'

/**
 * Escaner de exposicion de solo lectura. Pide a la red lo justo segun la
 * profundidad y deja que el dominio interprete. No manda ninguna carga que
 * modifique nada: leer si la puerta cede, no derribarla.
 */
export function createClaudePostureScanner(): PostureScanner {
  return {
    scan: async (target, families) => {
      const startedAt = Date.now()

      const root = await fetchRoot(target)
      const redirectsToHttps = families.includes('tls') ? await checkHttpRedirect(target) : false
      const paths = families.includes('exposed') ? await probePaths(target) : []

      const findings = buildFindings(target, families, { root, redirectsToHttps, paths })

      return {
        host: target.host,
        score: postureScore(findings),
        findings,
        durationMs: Date.now() - startedAt,
        at: nowIso()
      } satisfies PostureResult
    }
  }
}
