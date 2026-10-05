import type { AnalystRunMeta } from '@domain/repair/analysis'
import { parseOmegaResponse } from '@domain/repair/omega-parse'
import { notasDeObjeto } from '@domain/system/extraer-notas'
import type { SelfNoteDraft } from '@domain/system/self-observation'
import type { OmegaVerdict } from '@domain/repair/omega-verdict'
import type { TokenUsage } from '@domain/telemetry/token-usage'
import { salidaDelJuez } from './salida-del-juez'
import { MODELO_DE_OMEGA } from '@domain/agent/escalera-de-modelos'
import type { JuicioDelModelo } from '@domain/agent/guardia-del-modelo'

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
  | { ok: true; verdict: OmegaVerdict; runMeta: AnalystRunMeta; notas: readonly SelfNoteDraft[] }
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
  meta: (usage?: TokenUsage, juicio?: JuicioDelModelo) => AnalystRunMeta
): OmegaRunResult {
  // El 429 y el modelo ajeno no son veredictos mal escritos: son AVERIA.
  const { usage, text, juicio, fallo } = salidaDelJuez(out, MODELO_DE_OMEGA)
  if (fallo !== undefined) return { ok: false, error: fallo.error, detail: fallo.detalle, timedOut: false, runMeta: meta(usage, juicio) } // prettier-ignore
  const parsed = parseOmegaResponse(text)
  if ('error' in parsed) {
    // prettier-ignore
    return { ok: false, error: 'omega_response_invalid', detail: parsed.error, raw: text, timedOut: false, runMeta: meta(usage, juicio) }
  }
  // Las notas se leen del MISMO bloque pero por la puerta TOLERANTE, nunca por
  // `parseOmegaResponse`: ahi un campo desconocido invalida el veredicto entero
  // —«no se inventan ejes»— y una nota mal escrita tumbaria el juicio que la
  // acompana. Son dos contratos con dureza distinta a proposito (ADR-085).
  return { ok: true, verdict: parsed.verdict, runMeta: meta(usage, juicio), notas: notasDelVerdict(text) }
}

/** El objeto del VERDICT, releido solo para sus notas. Si no se entiende, no hay
 *  notas y no pasa nada mas: el veredicto ya se leyo por su cuenta. */
function notasDelVerdict(text: string): readonly SelfNoteDraft[] {
  const match = /VERDICT:\s*(\{[\s\S]*?\})\s*:END-VERDICT/.exec(text)
  if (match === null) return []

  try {
    return notasDeObjeto(JSON.parse(match[1]))
  } catch {
    return []
  }
}
