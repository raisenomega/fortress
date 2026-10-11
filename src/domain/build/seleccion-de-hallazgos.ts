import type { Finding } from '../project/finding'
import { esGrave } from './hallazgos-del-marco'

/**
 * Nunca ciega al CTO de lo grave: TODOS los CRITICAL/HIGH entran, pase lo que
 * pase con el tope; el resto se topa para no reventar el contexto. Conserva el
 * orden de la consulta (urgencia): el tope recorta por la cola, no por severidad.
 */
export function seleccionarHallazgos(vivos: readonly Finding[], tope: number): readonly Finding[] {
  const presupuestoResto = Math.max(0, tope - vivos.filter(esGrave).length)
  let resto = 0
  return vivos.filter((f) => {
    if (esGrave(f)) return true
    if (resto < presupuestoResto) {
      resto += 1
      return true
    }
    return false
  })
}

/** El total REAL (sin extinguir) y cuanto de el ya no es un vivo-abierto. */
export function cabeceraDeHallazgos(vivos: readonly Finding[], mostrados: number): string {
  const descartados = vivos.filter((f) => f.status === 'false_positive').length
  const mitigados = vivos.filter((f) => f.lifecycle === 'MITIGATED').length
  const extra = [
    descartados ? `${descartados} descartados` : '',
    mitigados ? `${mitigados} mitigados` : ''
  ].filter(Boolean)
  const cola = extra.length > 0 ? `; ${extra.join(', ')}` : ''
  return `${vivos.length} sin extinguir (muestra ${mostrados}${cola}):`
}
