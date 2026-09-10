// prettier-ignore
import { MANIFIESTO_VACIO, type Manifiesto, type ParadaDeCarpeta } from '@domain/scan/manifiesto'
import { esDeCarpeta } from '@domain/scan/parada'
import type { DetectedFinding } from '@domain/scan/detected-finding'

/** Una parada de carpeta, con su clase puesta. */
export const deCarpeta = (carpeta: string, ficheros: readonly string[]): ParadaDeCarpeta => ({
  clase: 'carpeta',
  carpeta,
  ficheros
})

/** Cuatro carpetas con una sensible y otra de pagos, para probar la prioridad. */
export const CUATRO: Manifiesto = {
  ...MANIFIESTO_VACIO,
  paradas: [
    deCarpeta('web', ['web/a.ts', 'web/b.ts']),
    deCarpeta('auth', ['auth/login.ts']),
    deCarpeta('utils', ['utils/fmt.ts']),
    deCarpeta('payment', ['payment/checkout.ts', 'payment/refund.ts'])
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

export const ficherosDe = (manifiesto: Manifiesto, carpetas: readonly string[]): number =>
  manifiesto.paradas
    .filter(esDeCarpeta)
    .filter((p) => carpetas.includes(p.carpeta))
    .reduce((n, p) => n + p.ficheros.length, 0)
