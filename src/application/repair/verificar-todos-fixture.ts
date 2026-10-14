import { vi } from 'vitest'
import type { FindingMemory } from '@domain/project/finding-memory'
import type { AppContext } from '../context'
import { hallazgo } from './plan-repair-analyst-fake'
import * as intento from './intento-de-verificacion'
import type { VerificacionMasivaDeps } from './verificar-todos'

export const mitigado = (id: string): FindingMemory => ({
  ...hallazgo(id, 'src/api.ts'),
  lifecycle: 'MITIGATED',
  mitigatedAt: '2026-09-01T10:00:00Z'
})

/**
 * El banco RE-LEE la lista en cada llamada, como el de verdad. Es lo que deja
 * probar que el bucle la toma UNA vez: si la tomara cada vuelta, un mitigado que
 * sigue mitigado volveria a salir.
 */
export function banco(
  findings: readonly FindingMemory[],
  conPropuestaViva: readonly string[] = []
): AppContext {
  return {
    findings: { listMemory: () => [...findings] },
    // `recorrerVerificaciones` vacia el grafo de imports al arrancar la corrida.
    rutaDelControl: { olvidar: () => undefined },
    // Lo lee `motivoDeLaOmision` para repartir los que no se verificaron: sin
    // esto, un `null` en el barrido no sabria a que casilla va.
    repairProposals: { findLiveFindingIds: () => [...conPropuestaViva] }
  } as unknown as AppContext
}

/** El verificador doblado: devuelve estos desenlaces en orden. `null` es «ya lo
 *  trabaja una propuesta»; un `Error` se lanza, como lo lanzaria el analista. */
export function verificador(
  ...salidas: readonly (string | null | Error)[]
): ReturnType<typeof vi.spyOn> {
  // prettier-ignore
  let i = 0
  return vi.spyOn(intento, 'intentarVerificar').mockImplementation(() => {
    // Indice y no `??`: `null` es un desenlace legitimo —«ya lo trabaja una
    // propuesta»— y el operador de coalescencia se lo tragaba.
    const s = i < salidas.length ? salidas[i] : 'sin_prueba'
    i += 1
    if (s instanceof Error) return Promise.resolve({ ok: false, error: s.message })
    return Promise.resolve({ ok: true, desenlace: s })
  })
}

export const deps = (over: Partial<VerificacionMasivaDeps> = {}): VerificacionMasivaDeps => ({
  cancelado: () => false,
  avisar: () => undefined,
  ...over
})
