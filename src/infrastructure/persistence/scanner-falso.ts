import type { ScanRequest, Scanner } from '@domain/scan/scanner'
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
export function scannerFalso(alEmpezar: (carpeta: string) => void = () => undefined): ScannerFalso {
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
      return ok({
        findings: [hallazgoDe(carpeta)],
        // La misma que `corrida` del otro fixture: asi las dos filas del test
        // de equivalencia son comparables columna a columna.
        durationMs: 1234,
        usage: SIN_FACTURA,
        tools: [],
        edits: [],
        texto: `informe de ${carpeta}`
      })
    }
  }
}
