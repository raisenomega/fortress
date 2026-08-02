import { err, ok, type Result } from '@domain/shared/result'
import type { AppContext } from '../context'

/**
 * Descartar un hallazgo como falso positivo. Tiene consecuencias reales: deja
 * de contar para el score y, si era CRITICAL, desbloquea el push. Por eso la
 * decision se recuerda con su huella y sobrevive a los escaneos siguientes,
 * en vez de tener que repetirla cada vez.
 */
export function dismissFinding(context: AppContext, findingId: string): Result<null> {
  return context.findings.dismiss(findingId)
    ? ok(null)
    : err('Ese hallazgo ya no existe: puede que un escaneo posterior lo resolviera')
}

/** Vuelve a contarlo. Sirve para deshacer un descarte hecho por error. */
export function reopenFinding(context: AppContext, findingId: string): Result<null> {
  return context.findings.reopen(findingId) ? ok(null) : err('Ese hallazgo ya no existe')
}
