import type { DesenlaceEnLote } from './desenlace-del-lote'
import { porQueNoCerraron, type SinCierre } from './motivo-sin-cierre'

const GRUPOS: ReadonlyArray<readonly [DesenlaceEnLote, string]> = [
  ['extinguido', 'a Historia'],
  ['sigue_vivo', 'siguen activos'],
  ['sin_prueba', 'sin prueba'],
  ['pendiente', 'pendientes de verificar'],
  ['no_cerro', 'no cerraron (degradaron, revirtieron o sin cambios)']
]

/** El parte del lote para el Terminal: cuantos se lanzaron y como quedo cada grupo. */
export function resumenDelLote(
  desenlaces: readonly DesenlaceEnLote[],
  total: number,
  motivos: readonly SinCierre[] = [],
  /** Cuantos se quedaron escritos sin que nadie compilara el proyecto (ADR-091). */
  sinVerificar = 0
): string {
  const cuenta = (d: DesenlaceEnLote): number => desenlaces.filter((x) => x === d).length
  const grupos = GRUPOS.map(([d, etiqueta]) => `${cuenta(d)} ${etiqueta}`).join(', ')
  const omitidos = cuenta('omitido')
  const sinLanzar = total - desenlaces.length
  return [
    `Lote: ${desenlaces.length - omitidos} de ${total} procesados — ${grupos}.`,
    porQueNoCerraron(motivos),
    sinVerificar > 0 ? textoSinVerificar(sinVerificar) : '',
    omitidos > 0 ? `${omitidos} omitidos: ya no pedian trabajo.` : '',
    sinLanzar > 0 ? `Cortado: ${sinLanzar} sin lanzar.` : ''
  ]
    .filter((linea) => linea !== '')
    .join(' ')
}

/** Lo que el operador lee del lote cuando algo se conservo sin compilarse. No
 *  se esconde en una nota al pie: va en el parte, junto a las cuentas. */
function textoSinVerificar(n: number): string {
  const plural = n > 1 ? 's' : ''
  return `OJO: ${n} se quedo${plural} escrito${plural} SIN comprobar que el proyecto compila (faltaba la herramienta o el script). Revisalo${plural} tu.` // prettier-ignore
}
