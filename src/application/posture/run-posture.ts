import { familiesFor } from '@domain/posture/scan-depth'
import { parseTarget } from '@domain/posture/target-url'
import type { PostureRequest, PostureResult } from '@domain/posture/posture-scan'
import type { PostureScanner } from '@domain/posture/posture-scanner'
import { err, ok, type Result } from '@domain/shared/result'

const NOT_OWNED =
  'Confirma que el sitio es tuyo o que tienes permiso para auditarlo. FORTRESS ' +
  'solo revisa lo que es tuyo.'

/**
 * Audita la exposicion externa de un sitio propio. Comprueba el permiso ANTES
 * de tocar la red: sin esa confirmacion no se envia ni una peticion.
 */
export async function runPosture(
  scanner: PostureScanner,
  request: PostureRequest
): Promise<Result<PostureResult>> {
  if (!request.owned) return err(NOT_OWNED)

  const target = parseTarget(request.url)
  if (!target.ok) return err(target.error)

  return ok(await scanner.scan(target.value, familiesFor(request.depth)))
}
