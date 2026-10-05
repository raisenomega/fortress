import { errorDelProveedor } from '../claude-code/error-del-proveedor'
import { parseUsage } from '../claude-code/parse-usage'
import type { RunOut } from './parse-analysis'
import { modelosUsados } from '../claude-code/modelos-usados'

/**
 * Abre el sobre JSON del CLI del analista: su texto, su factura y —si lo hubo—
 * el fallo DEL PROVEEDOR, que se mira antes de dar el texto por respuesta. Sin
 * esto el aviso de cuota viajaba como si fuera el analisis (la rafaga del
 * 2026-10-05). Sin JSON valido, el crudo tal cual y sin factura.
 */
export function salidaDelAnalista(out: string): RunOut {
  try {
    const j = JSON.parse(out) as Record<string, unknown>
    const proveedor = errorDelProveedor(j)
    const texto = typeof j.result === 'string' ? j.result : ''
    return { result: texto, usage: parseUsage(j), modelos: modelosUsados(j), ...(proveedor === null ? {} : { proveedor }) } // prettier-ignore
  } catch {
    return { result: out }
  }
}
