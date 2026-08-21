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

/**
 * El operador marca un hallazgo como YA ARREGLADO. Es lifecycle, no status:
 * descartar dice "esto no era un problema"; mitigar dice "lo era y lo arregle".
 * Mezclarlos haria que descartar pareciera arreglar.
 *
 * La nota es texto libre a proposito — normalmente el sha del arreglo. No se
 * valida ni se parsea: quien la lea es un humano, y exigirle formato solo
 * conseguiria que no la escribiera.
 */
export function markMitigatedFinding(
  context: AppContext,
  findingId: string,
  note: string
): Result<null> {
  return context.findings.markMitigated(findingId, note.trim(), new Date().toISOString())
    ? ok(null)
    : err('Ese hallazgo ya no estaba vivo: puede que un escaneo posterior lo cerrara')
}

/** Deshace la marca de mitigado: el hallazgo vuelve a la cola del motor. */
export function markActiveFinding(context: AppContext, findingId: string): Result<null> {
  return context.findings.markActive(findingId)
    ? ok(null)
    : err('Ese hallazgo no estaba marcado como arreglado')
}
