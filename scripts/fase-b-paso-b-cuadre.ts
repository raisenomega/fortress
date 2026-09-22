import { veredictosDelLote, type ZombiAJuzgar } from '../src/domain/project/veredictos-del-lote.ts'
import type { FilaDelPasoB } from './fase-b-paso-b-plan.ts'

type Respuesta = Parameters<typeof veredictosDelLote>[1][number]

/** Del plan revisado, de vuelta a la respuesta que lo produjo: asi se recalcula. */
function aRespuesta(v: FilaDelPasoB): Respuesta {
  if (v.desenlace === 'sin_decidir') return { id: v.id }
  const evidencia = v.desenlace === 'extinguida' ? { marcador: v.motivo.split('"')[1] ?? '', forma: v.motivo.endsWith('presente') ? 'presente' : 'ausente' } : undefined // prettier-ignore
  return { id: v.id, status: v.desenlace === 'real' ? 'REAL' : 'OBSOLETO', tipo: v.tipo, simbolo: v.simbolo, evidencia } // prettier-ignore
}

/**
 * El veredicto de HOY, con el fichero de hoy, tiene que ser el del plan: si un
 * fichero cambio entre el plan y la ejecucion, la prueba de un OBSOLETO puede
 * haberse ido —o haber aparecido— y lo que Jojo aprobo ya no es lo que se
 * escribiria. Fail-closed: se recalcula y, si no coincide, no se escribe nada.
 */
export function cuadrarConHoy(
  zombis: readonly ZombiAJuzgar[],
  plan: readonly FilaDelPasoB[],
  contenidoDe: (file: string) => string | null
): void {
  const hoy = veredictosDelLote(zombis, plan.map(aRespuesta), contenidoDe)
  const porId = new Map(plan.map((v) => [v.id, v.desenlace]))
  const cambiados = hoy.filter((h) => h.desenlace !== porId.get(h.id))
  if (cambiados.length > 0) {
    throw new Error(`fail-closed: ${cambiados.length} veredictos cambiarian hoy (el fichero cambio): ${cambiados.map((c) => c.id.slice(0, 8)).join(' ')}`) // prettier-ignore
  }
}
