import { countFindings, type SeverityCounts } from './severity-counts'
import { estadoDelTablero, type EstadoDelTablero } from './estado-del-tablero'
import { filtrarElTablero, TODAS, type FiltroDelTablero } from './filtro-del-tablero'
import type { Finding } from './finding'

export type EstadoCounts = Readonly<Record<EstadoDelTablero, number>>

const NINGUNO: EstadoCounts = { 'por-reparar': 0, mitigados: 0, descartados: 0 }

export function contarEstados(findings: readonly Finding[]): EstadoCounts {
  const counts: Record<EstadoDelTablero, number> = { ...NINGUNO }
  for (const finding of findings) counts[estadoDelTablero(finding)] += 1
  return counts
}

/** Lo que dice cada chip, y el total de su fila (el chip «todas»). */
export interface RecuentoDelTablero {
  readonly porSeveridad: SeverityCounts
  readonly totalSeveridad: number
  readonly porEstado: EstadoCounts
  readonly totalEstado: number
}

/**
 * Los numeros de los chips, CRUZADOS: cada eje se cuenta sobre lo que el OTRO
 * eje deja pasar.
 *
 * Es la unica forma de que el chip siga prometiendo lo que muestra cuando hay
 * dos filtros. Contando cada eje sobre la lista entera, estando en «mitigados»
 * el chip HIGH diria 76 y al pulsarlo saldrian 5: el numero seria cierto sobre
 * un conjunto que el operador no esta mirando, que es la peor clase de cierto.
 *
 * El total de cada fila es el de su propia vista, no el de la tabla: en
 * «mitigados», el chip «todas» de severidad dice 26, no 508.
 */
export function recuentoDelTablero(
  findings: readonly Finding[],
  filtro: FiltroDelTablero
): RecuentoDelTablero {
  const porEstadoSolo = filtrarElTablero(findings, { severidad: TODAS, estado: filtro.estado })
  const porSeveridadSola = filtrarElTablero(findings, {
    severidad: filtro.severidad,
    estado: TODAS
  })

  return {
    porSeveridad: countFindings(porEstadoSolo),
    totalSeveridad: porEstadoSolo.length,
    porEstado: contarEstados(porSeveridadSola),
    totalEstado: porSeveridadSola.length
  }
}
