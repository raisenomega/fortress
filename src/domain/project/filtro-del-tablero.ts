import type { Severity } from '../shared/severity'
import type { Finding } from './finding'
import { estadoDelTablero, type EstadoDelTablero } from './estado-del-tablero'

/** «Todas», el valor por defecto de los dos ejes. No es una severidad ni un
 *  estado: es la ausencia de filtro, y por eso tiene nombre propio. */
export const TODAS = 'ALL'

export type FiltroDeSeveridad = Severity | typeof TODAS
export type FiltroDeEstado = EstadoDelTablero | typeof TODAS

export interface FiltroDelTablero {
  readonly severidad: FiltroDeSeveridad
  readonly estado: FiltroDeEstado
}

/** Sin filtrar nada: lo que ve quien abre el tablero por primera vez. */
export const SIN_FILTRO: FiltroDelTablero = { severidad: TODAS, estado: TODAS }

/**
 * Lo que el tablero ensena con un filtro puesto. Los dos ejes se aplican a la
 * vez y se cruzan —«mitigados» Y «HIGH» son las HIGH verificables—, que es la
 * razon de que sean dos filas de chips y no una.
 *
 * Funcion PURA y en el dominio, no un `.filter` suelto en el componente: hay
 * TRES consumidores del mismo calculo —la tabla, «seleccionar todas las
 * visibles» y el contador honesto de la barra— y tres copias del mismo criterio
 * divergen. Ademas asi se puede probar sin montar React.
 */
export function filtrarElTablero(
  findings: readonly Finding[],
  filtro: FiltroDelTablero
): readonly Finding[] {
  if (filtro.severidad === TODAS && filtro.estado === TODAS) return findings

  return findings.filter(
    (f) =>
      (filtro.severidad === TODAS || f.severity === filtro.severidad) &&
      (filtro.estado === TODAS || estadoDelTablero(f) === filtro.estado)
  )
}
