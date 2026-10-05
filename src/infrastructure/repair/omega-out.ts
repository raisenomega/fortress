import type { TokenUsage } from '@domain/telemetry/token-usage'
import { errorDelProveedor } from '../claude-code/error-del-proveedor'
import { parseUsage } from '../claude-code/parse-usage'

/**
 * Separa la respuesta del CLI de claude (--output-format json): el texto del
 * agente y su factura. Sin JSON valido se devuelve el crudo y la factura queda
 * AUSENTE, no en cero: una de ceros afirmaria que la corrida salio gratis.
 */
export function processOmegaOut(out: string): { usage?: TokenUsage; text: string; proveedor?: string } {
  try {
    const j = JSON.parse(out) as Record<string, unknown>
    // El fallo del proveedor (cuota, auth) viaja APARTE: su aviso no es respuesta.
    const proveedor = errorDelProveedor(j)
    return { usage: parseUsage(j), text: typeof j.result === 'string' ? j.result : out, ...(proveedor === null ? {} : { proveedor }) } // prettier-ignore
  } catch {
    return { text: out }
  }
}
