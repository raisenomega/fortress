import { EMPTY_USAGE, type TokenUsage } from '@domain/telemetry/token-usage'
import { MAX_TURNS } from './generator-args'
import { parseUsage } from '../claude-code/parse-usage'

/** Como marca el CLI la corrida que se quedo sin turnos. */
const SIN_TURNOS = 'error_max_turns'

export type Desenlace =
  | { readonly ok: true; readonly usage: TokenUsage }
  | {
      readonly ok: false
      readonly error: string
      readonly turnosAgotados?: true
      readonly usage: TokenUsage
    }

/**
 * Que fue de la corrida, leido de su salida.
 *
 * Agotar los turnos tiene desenlace PROPIO y se mira antes que el codigo de
 * salida: disfrazarlo de averia del generador —o peor, de exceso de
 * presupuesto— dejaria al operador buscando una causa que no existe. No
 * completo en N vueltas es un hecho, y se dice.
 */
export function desenlaceDelGenerador(out: string, code: number | null): Desenlace {
  let usage = EMPTY_USAGE
  let subtype = ''
  try {
    const j = JSON.parse(out) as Record<string, unknown>
    usage = parseUsage(j)
    subtype = typeof j.subtype === 'string' ? j.subtype : ''
  } catch {
    // Sin JSON no hay factura: tokensUsed queda undefined, no inventado.
  }

  if (subtype === SIN_TURNOS) {
    return { ok: false, error: `no completo en ${MAX_TURNS} turnos`, turnosAgotados: true, usage }
  }
  if (code === 0) return { ok: true, usage }
  return { ok: false, error: `el generador salio con codigo ${code}`, usage }
}
