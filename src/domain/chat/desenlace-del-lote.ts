import type { Finding } from '../project/finding'
import { pendienteDeVerificar } from './cierre-del-ciclo'
import type { SinCierre } from './motivo-sin-cierre'

/**
 * Como quedo UN hallazgo del lote. `omitido`: cuando le toco, ya no pedia
 * trabajo. `negado`: una puerta del main paro su envio antes de que el turno
 * existiera — no dice nada del hallazgo, y por eso corta la cola (`parte-del-lote`).
 */
export type DesenlaceEnLote =
  'extinguido' | 'sigue_vivo' | 'sin_prueba' | 'pendiente' | 'no_cerro' | 'omitido' | 'negado'

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
