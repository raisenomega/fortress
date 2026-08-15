import { EMPTY_USAGE, type TokenUsage } from '@domain/telemetry/token-usage'
import { parseUsage } from '../claude-code/parse-usage'

/**
 * Separa la respuesta del CLI de claude (--output-format json): el texto del
 * agente y su factura de tokens. Sin JSON valido se devuelve el crudo y la
 * factura queda en cero — sin inventar numeros.
 */
export function processOmegaOut(out: string): { usage: TokenUsage; text: string } {
  try {
    const j = JSON.parse(out) as Record<string, unknown>
    return { usage: parseUsage(j), text: typeof j.result === 'string' ? j.result : out }
  } catch {
    return { usage: EMPTY_USAGE, text: out }
  }
}
