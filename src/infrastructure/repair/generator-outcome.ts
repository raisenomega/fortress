import type { TokenUsage } from '@domain/telemetry/token-usage'
import { MAX_TURNS } from './generator-args'
import { parseUsage } from '../claude-code/parse-usage'

/** Como marca el CLI la corrida que se quedo sin turnos. */
const SIN_TURNOS = 'error_max_turns'

/** `usage` ausente = el CLI no dejo factura legible. No es una de ceros.
 *  `sesion` ausente = no hay nada que reanudar (ver `sesionDeLaCorrida`). */
export type Desenlace =
  | { readonly ok: true; readonly usage?: TokenUsage; readonly sesion?: string }
  | {
      readonly ok: false
      readonly error: string
      readonly turnosAgotados?: true
      readonly usage?: TokenUsage
      readonly sesion?: string
    }

/**
 * La sesion que merece reanudarse, o nada.
 *
 * CERO TURNOS NO ES UNA SESION, y la regla no es teorica: medido en el CLI
 * 2.1.272, un `--resume` que no encuentra la sesion contesta `is_error`,
 * `num_turns: 0` y un `session_id` NUEVO que no es el pedido. Mirar si hay id no
 * basta —lo hay, y es falso—. Es la misma regla que `sesionUtil` del Terminal,
 * y se repite aqui porque el dato lo da el JSON del generador, que es otro
 * camino.
 *
 * La que AGOTO LOS TURNOS si cuenta, y es la que mas: es trabajo a medias que
 * continuar, no una corrida perdida.
 */
function sesionDeLaCorrida(j: Record<string, unknown>, usage?: TokenUsage): string | undefined {
  const id = typeof j.session_id === 'string' && j.session_id !== '' ? j.session_id : undefined
  return id === undefined || (usage?.numTurns ?? 0) === 0 ? undefined : id
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
  let usage: TokenUsage | undefined
  let subtype = ''
  let sesion: string | undefined
  try {
    const j = JSON.parse(out) as Record<string, unknown>
    usage = parseUsage(j)
    subtype = typeof j.subtype === 'string' ? j.subtype : ''
    sesion = sesionDeLaCorrida(j, usage)
  } catch {
    // Sin JSON no hay factura, y `undefined` lo dice. Ceros diria "gratis".
  }

  if (subtype === SIN_TURNOS) {
    return { ok: false, error: `no completo en ${MAX_TURNS} turnos`, turnosAgotados: true, usage, sesion } // prettier-ignore
  }
  if (code === 0) return { ok: true, usage, sesion }
  return { ok: false, error: `el generador salio con codigo ${code}`, usage, sesion }
}
