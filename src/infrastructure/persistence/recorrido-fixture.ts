import { MANIFIESTO_VACIO, type Manifiesto, type Parada } from '@domain/scan/manifiesto'
import type { DetectedFinding } from '@domain/scan/detected-finding'
import type { ScanRequest, Scanner } from '@domain/scan/scanner'
import { ok } from '@domain/shared/result'
import { SIN_FACTURA } from './cierre-partido-fixture'

/** Cuatro carpetas con una sensible y otra de pagos, para probar la prioridad. */
export const CUATRO: Manifiesto = {
  ...MANIFIESTO_VACIO,
  paradas: [
    { carpeta: 'web', ficheros: ['web/a.ts', 'web/b.ts'] },
    { carpeta: 'auth', ficheros: ['auth/login.ts'] },
    { carpeta: 'utils', ficheros: ['utils/fmt.ts'] },
    { carpeta: 'payment', ficheros: ['payment/checkout.ts', 'payment/refund.ts'] }
  ],
  ficherosTotal: 6
}

/** Un hallazgo por carpeta, para saber de cual vino cada uno. */
export const hallazgoDe = (carpeta: string): DetectedFinding => ({
  severity: 'MEDIUM',
  title: `Algo en ${carpeta}`,
  file: `${carpeta}/a.ts`,
  line: 1
})

export interface ScannerFalso extends Scanner {
  /** Las carpetas pedidas, EN ORDEN. Es lo que prueba la prioridad. */
  readonly pedidas: readonly string[]
}

/**
 * Un escaner que responde una parada a la vez. `alEmpezar` corre ANTES de que
 * la parada devuelva: es el gancho para simular que el operador aprieta Detener
 * mientras una parada esta a mitad.
 */
export function scannerFalso(alEmpezar: (carpeta: string) => void = () => undefined): ScannerFalso {
  const pedidas: string[] = []

  return {
    pedidas,
    isAvailable: () => true,
    precheck: () => null,
    scan: async (request: ScanRequest) => {
      const carpeta = request.rutas?.[0] ?? '(todo)'
      pedidas.push(carpeta)
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

export const ficherosDe = (manifiesto: Manifiesto, carpetas: readonly string[]): number =>
  manifiesto.paradas
    .filter((p: Parada) => carpetas.includes(p.carpeta))
    .reduce((n, p) => n + p.ficheros.length, 0)
