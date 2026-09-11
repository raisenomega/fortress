import type { ScanRequest, Scanner } from '@domain/scan/scanner'
import type { TokenUsage } from '@domain/telemetry/token-usage'
import { ok } from '@domain/shared/result'
import { SIN_FACTURA } from './cierre-partido-fixture'
import { hallazgoDe } from './recorrido-fixture'

export interface ScannerFalso extends Scanner {
  /** Los rotulos pedidos, EN ORDEN. Es lo que prueba la prioridad. */
  readonly pedidas: readonly string[]
  /** Las peticiones enteras: prueban que un tema va SIN rutas. */
  readonly peticiones: readonly ScanRequest[]
}

/**
 * Un escaner que responde una parada a la vez. `alEmpezar` corre ANTES de que
 * la parada devuelva: es el gancho para simular que el operador aprieta Detener
 * mientras una parada esta a mitad.
 */
/** Una factura propia de cada parada, para que la serie no se pueda confundir
 *  con la suma: si todas costaran lo mismo, doce filas iguales y el agregado
 *  dividido entre doce serian indistinguibles. */
export type FacturaDeParada = (
  carpeta: string,
  indice: number
) => {
  readonly durationMs: number
  readonly usage: TokenUsage
}

const IGUAL_PARA_TODAS: FacturaDeParada = () => ({ durationMs: 1234, usage: SIN_FACTURA })

export function scannerFalso(
  alEmpezar: (carpeta: string) => void = () => undefined,
  factura: FacturaDeParada = IGUAL_PARA_TODAS
): ScannerFalso {
  const pedidas: string[] = []
  const peticiones: ScanRequest[] = []

  return {
    pedidas,
    peticiones,
    isAvailable: () => true,
    precheck: () => null,
    scan: async (request: ScanRequest) => {
      const carpeta = request.rutas?.[0] ?? '(todo)'
      pedidas.push(carpeta)
      peticiones.push(request)
      alEmpezar(carpeta)
      // Por defecto la misma que `corrida` del otro fixture: asi las dos filas
      // del test de equivalencia son comparables columna a columna.
      const suya = factura(carpeta, peticiones.length)
      return ok({
        findings: [hallazgoDe(carpeta)],
        durationMs: suya.durationMs,
        usage: suya.usage,
        tools: [],
        edits: [],
        texto: `informe de ${carpeta}`, notas: []
      })
    }
  }
}
