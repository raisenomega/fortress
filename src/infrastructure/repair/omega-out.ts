import type { TokenUsage } from '@domain/telemetry/token-usage'
import { parseUsage } from '../claude-code/parse-usage'

/**
 * Separa la respuesta del CLI de claude (--output-format json): el texto del
 * agente y su factura. Sin JSON valido se devuelve el crudo y la factura queda
 * AUSENTE, no en cero: una de ceros afirmaria que la corrida salio gratis.
 */
export function processOmegaOut(out: string): { usage?: TokenUsage; text: string } {
  try {
    const j = JSON.parse(out) as Record<string, unknown>
    return { usage: parseUsage(j), text: typeof j.result === 'string' ? j.result : out }
  } catch {
    return { text: out }
  }
}
