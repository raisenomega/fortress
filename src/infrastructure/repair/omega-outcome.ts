import type { AnalystRunMeta } from '@domain/repair/analysis'
import { parseOmegaResponse } from '@domain/repair/omega-parse'
import type { OmegaVerdict } from '@domain/repair/omega-verdict'
import type { TokenUsage } from '@domain/telemetry/token-usage'
import { processOmegaOut } from './omega-out'

/**
 * Lo que sale de una corrida de OMEGA ya cerrada.
 *
 * En el fallo de lectura viaja la autopsia entera: `detail` es el diagnostico
 * que `parseOmegaResponse` ya calculo, y `raw` el texto tal como llego. Antes se
 * tiraban los dos y una propuesta que habia pasado el gate en verde se perdia
 * con la constante generica por toda explicacion — ni siquiera se sabia cual de
 * las tres puertas del parser habia fallado.
 */
export type OmegaRunResult =
  | { ok: true; verdict: OmegaVerdict; runMeta: AnalystRunMeta }
  | {
      ok: false
      error: string
      timedOut: boolean
      /** El CLI no llego a arrancar: no hubo juicio, ni bueno ni malo. */
      noArranco?: true
      runMeta: AnalystRunMeta
      detail?: string
      raw?: string
    }

/**
 * Abre el sobre del CLI y lee el veredicto, o devuelve el fallo con su autopsia.
 *
 * `error` sigue siendo la constante que CLASIFICA —la razon de rechazo es una
 * union cerrada del dominio y el asiento la necesita estable—; el diagnostico
 * preciso viaja aparte, en `detail`. Separar clasificacion de diagnostico es lo
 * que permite conservar el segundo sin mover la primera.
 *
 * El crudo va ENTERO, sin recortar: el fallo es raro y una muestra no basta
 * para reproducirlo. Es el mismo trato que el gate le da a su autopsia.
 */
export function toOmegaOutcome(
  out: string,
  meta: (usage?: TokenUsage) => AnalystRunMeta
): OmegaRunResult {
  const { usage, text } = processOmegaOut(out)
  const parsed = parseOmegaResponse(text)
  if ('error' in parsed) {
    // prettier-ignore
    return { ok: false, error: 'omega_response_invalid', detail: parsed.error, raw: text, timedOut: false, runMeta: meta(usage) }
  }
  return { ok: true, verdict: parsed.verdict, runMeta: meta(usage) }
}
