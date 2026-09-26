import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { DesenlaceDelEnvio } from '@domain/chat/desenlace-del-envio'
import { useColaDelLoteStore } from '../stores/cola-del-lote-store'

const { estado } = vi.hoisted(() => ({
  estado: { plan: null as DesenlaceDelEnvio['plan'], resueltos: [] as string[] }
}))

vi.mock('./chat-service', () => ({
  sendMessage: (): Promise<DesenlaceDelEnvio> =>
    Promise.resolve({ sinCierre: null, sinVerificar: false, plan: estado.plan, negado: null })
}))

vi.mock('./resolver-lote-en-terminal', () => ({
  resolverLotePendiente: (projectId: string): Promise<void> => {
    estado.resueltos.push(projectId)
    return Promise.resolve()
  }
}))

const { planDelLote } = await import('./lote-por-enter')
const cola = (): ReturnType<typeof useColaDelLoteStore.getState> => useColaDelLoteStore.getState()

beforeEach(() => {
  estado.resueltos.length = 0
  estado.plan = null
  useColaDelLoteStore.getState().descartar()
  useColaDelLoteStore.getState().preparar('p1', ['f1', 'f2'])
})

/**
 * ADR-097 §3: en autonomo el ADELANTE de OMEGA ocupa la silla del clic. El
 * disparo de aqui NO es la garantia —esa vive en `guardPlanAprobado`, abajo—:
 * solo ahorra el gesto que ya nadie puede dar, porque el boton no se pinta.
 */
describe('el ADELANTE dispara la ejecucion sin clic', () => {
  it('con ADELANTE, el lote se resuelve solo', async () => {
    estado.plan = 'ADELANTE'

    await planDelLote('p1', 'resuelve el lote', [])

    expect(estado.resueltos).toEqual(['p1'])
  })

  it('y NO se marca planeado: no hay boton que esperar', async () => {
    // Marcarlo pintaria el pie de «sin aprobar» sobre un lote que SI se aprobo.
    estado.plan = 'ADELANTE'

    await planDelLote('p1', 'resuelve el lote', [])

    expect(cola().pendiente?.planeado).toBe(false)
  })
})

describe('lo que no es ADELANTE no dispara nada', () => {
  it('con REPLANTEA: no se resuelve, y el veredicto queda para poder ENSENARLO', async () => {
    estado.plan = 'REPLANTEA'

    await planDelLote('p1', 'resuelve el lote', [])

    expect(estado.resueltos).toEqual([])
    expect(cola().pendiente).toMatchObject({ planeado: true, veredicto: 'REPLANTEA' })
  })

  it('SUPERVISADO INTACTO: sin veredicto, queda planeado esperando el Enter', async () => {
    // En supervisado el main no juzga y `plan` llega null: el flujo de siempre.
    estado.plan = null

    await planDelLote('p1', 'resuelve el lote', [])

    expect(estado.resueltos).toEqual([])
    expect(cola().pendiente).toMatchObject({ planeado: true, veredicto: null })
  })
})
