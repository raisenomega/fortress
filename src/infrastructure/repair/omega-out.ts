/**
 * Separa la respuesta del CLI de claude (--output-format json): el texto del
 * agente y su factura de tokens. Sin JSON valido se devuelve el crudo y la
 * factura queda en cero — sin inventar numeros.
 */
export function processOmegaOut(out: string): { tokens: number; text: string } {
  try {
    const j = JSON.parse(out) as { result?: string; usage?: Record<string, number> }
    const u = j.usage ?? {}
    const tokens = (u.input_tokens ?? 0) + (u.output_tokens ?? 0) + (u.cache_read_input_tokens ?? 0)
    return { tokens, text: j.result ?? out }
  } catch {
    return { tokens: 0, text: out }
  }
}
