import { totalTokens } from '@domain/telemetry/token-usage'
import { parseUsage } from '../claude-code/parse-usage'

/**
 * Separa la respuesta del CLI de claude (--output-format json): el texto del
 * agente y su factura de tokens. Sin JSON valido se devuelve el crudo y la
 * factura queda en cero — sin inventar numeros.
 */
export function processOmegaOut(out: string): { tokens: number; text: string } {
  try {
    const j = JSON.parse(out) as Record<string, unknown>
    const tokens = totalTokens(parseUsage(j))
    return { tokens, text: typeof j.result === 'string' ? j.result : out }
  } catch {
    return { tokens: 0, text: out }
  }
}
