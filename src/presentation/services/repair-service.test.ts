import { beforeEach, describe, expect, it } from 'vitest'
import type { Proposal } from '@domain/repair/proposal'
import { useRepairStore } from '../stores/repair-store'
import { useToastStore } from '../stores/toast-store'
import { loadRepair, proposeRepair } from './repair-service'

/** Doble del puente: fuera de Electron no existe `window.api`. */
function stubRepair(
  propose: () => Promise<unknown>,
  findings = (): Promise<unknown> => Promise.resolve([])
): void {
  const cerco = (): Promise<unknown> => Promise.resolve({ total: 0, fuera: 0 })
  // prettier-ignore
  Object.assign(globalThis, {
    window: {
      api: {
        repair: { propose, cerco, list: () => Promise.resolve([]) },
        scan: { findings }
      }
    }
  })
}

const PROPUESTA = { id: 'p-1', projectId: 'proj' } as Proposal
const avisos = (): readonly string[] => useToastStore.getState().toasts.map((t) => t.message)

beforeEach(() => {
  useToastStore.setState({ toasts: [] })
  useRepairStore.setState({
    busy: false, projectId: null, proposals: [], findings: [], cerco: { total: 0, fuera: 0 }
  }) // prettier-ignore
})

describe('proposeRepair: un clic que no produce nada tiene que decirlo', () => {
  it('sin candidato: avisa en vez de tragarse el clic', async () => {
    // Sobre el propio repo no se notaba nunca porque siempre hay escaneo. En
    // un proyecto recien registrado este es el caso normal, y era mudo.
    stubRepair(() => Promise.resolve({ ok: true, value: null }))
    await proposeRepair('proj')

    expect(avisos()[0]).toContain('No hay hallazgo que reparar')
    expect(useRepairStore.getState().busy).toBe(false)
  })

  it('con propuesta nueva: no molesta con avisos', async () => {
    stubRepair(() => Promise.resolve({ ok: true, value: PROPUESTA }))
    await proposeRepair('proj')

    expect(avisos()).toHaveLength(0)
  })

  it('canal en error: lo reporta y suelta el turno', async () => {
    stubRepair(() => Promise.resolve({ ok: false, error: 'sin Claude Code' }))
    await proposeRepair('proj')

    expect(avisos()).toEqual(['sin Claude Code'])
    expect(useRepairStore.getState().busy).toBe(false)
  })
})

describe('loadRepair: sin dato no se afirma nada', () => {
  it('lectura fallida: el slot conserva lo anterior, no lo vacia', async () => {
    // Guardar listas vacias diria que este proyecto no tiene propuestas sin
    // haberlo comprobado, y el indicador de la barra se pintaria en verde.
    useRepairStore.setState({ projectId: 'otro', proposals: [PROPUESTA], findings: [] })
    stubRepair(() => Promise.resolve({ ok: true, value: null }), () => Promise.reject(new Error('canal cerrado'))) // prettier-ignore

    await loadRepair('proj')

    expect(useRepairStore.getState().projectId).toBe('otro')
    expect(useRepairStore.getState().proposals).toHaveLength(1)
  })
})
