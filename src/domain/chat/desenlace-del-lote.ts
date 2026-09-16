import type { Finding } from '../project/finding'
import { pendienteDeVerificar } from './cierre-del-ciclo'
import { porQueNoCerraron, type SinCierre } from './motivo-sin-cierre'

/** Como quedo UN hallazgo del lote. `omitido`: cuando le toco, ya no pedia trabajo. */
export type DesenlaceEnLote =
  'extinguido' | 'sigue_vivo' | 'sin_prueba' | 'pendiente' | 'no_cerro' | 'omitido'

/** El comienzo fijo de la nota de «pendiente», sacado de quien la escribe (pieza
 *  3): si el texto cambia alli, esto lo sigue sin copiarlo. */
const PENDIENTE = pendienteDeVerificar('').split('(')[0]

/**
 * Se lee de la BASE tras recargar, no del turno: el renderer no recibe el
 * desenlace del cierre, y tocar ese contrato no es de este arco. Basta con lo que
 * la base deja, porque el lote solo lleva hallazgos activos y sin mitigar:
 * - ya no esta en la lista viva: se extinguio y paso a Historia;
 * - mitigado con la nota de pendiente: pendiente de verificar;
 * - mitigado con otra nota: el analista no pudo probarlo;
 * - activo con la nota cambiada: el analista dijo que sigue, vuelve a la cola;
 * - activo como estaba: el turno no cerro (degrado, revirtio o no edito).
 *
 * Con `sinCierre` no hace falta inferir esa ultima: el propio cierre dijo que
 * corto y por que guarda. Se prefiere el dato al descarte.
 */
export function desenlaceEnLote(
  antes: Finding,
  despues: Finding | undefined,
  sinCierre: SinCierre | null = null
): DesenlaceEnLote {
  if (despues === undefined || despues.lifecycle === 'EXTINCT') return 'extinguido'
  if (despues.lifecycle === 'MITIGATED') {
    return despues.verificacionNote?.startsWith(PENDIENTE) === true ? 'pendiente' : 'sin_prueba'
  }
  if (sinCierre !== null) return 'no_cerro'
  return despues.verificacionNote !== antes.verificacionNote ? 'sigue_vivo' : 'no_cerro'
}

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
  motivos: readonly SinCierre[] = []
): string {
  const cuenta = (d: DesenlaceEnLote): number => desenlaces.filter((x) => x === d).length
  const grupos = GRUPOS.map(([d, etiqueta]) => `${cuenta(d)} ${etiqueta}`).join(', ')
  const omitidos = cuenta('omitido')
  const sinLanzar = total - desenlaces.length
  return [
    `Lote: ${desenlaces.length - omitidos} de ${total} procesados — ${grupos}.`,
    porQueNoCerraron(motivos),
    omitidos > 0 ? `${omitidos} omitidos: ya no pedian trabajo.` : '',
    sinLanzar > 0 ? `Cortado: ${sinLanzar} sin lanzar.` : ''
  ]
    .filter((linea) => linea !== '')
    .join(' ')
}
