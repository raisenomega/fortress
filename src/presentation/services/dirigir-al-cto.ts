import { direccionALaCabeza } from '@domain/build/direccion-al-cto'
import { useConstruirStore } from '../stores/construir-store'
import { useLazoStore } from '../stores/lazo-store'
import { useScanStore } from '../stores/scan-store'

/** La direccion al hallazgo de la cabeza de la cola, o '' si no hay cabeza. */
export function textoDeDireccion(projectId: string): string {
  const cabezaId = useLazoStore.getState().cola?.[0] ?? null
  return direccionALaCabeza(cabezaId, useScanStore.getState().byProject[projectId] ?? [])
}

/**
 * ATERRIZAJE-3: antepone la direccion de la cabeza a lo que el lazo le entrega
 * al CTO —el reporte de vuelta (2b-b) o el empujon (2b-c)—, para que su PASO
 * ataque el hallazgo ENFOCADO (el de la cabeza). Sin cabeza deja el input como
 * esta: direccion generica, como hoy.
 */
export function dirigirAlCto(projectId: string): void {
  const dir = textoDeDireccion(projectId)
  if (dir === '') return
  const store = useConstruirStore.getState()
  store.setInput(`${dir}\n\n${store.input}`)
}
