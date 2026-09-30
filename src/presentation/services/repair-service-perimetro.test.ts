import { beforeEach, describe, expect, it } from 'vitest'
import { useRepairStore } from '../stores/repair-store'
import { useToastStore } from '../stores/toast-store'
import { proposeRepair } from './repair-service'

/** Doble del puente: fuera de Electron no existe `window.api`. */
function stubRepair(valor: unknown): void {
  const vacio = (): Promise<unknown> => Promise.resolve([])
  const cerco = (): Promise<unknown> =>
    Promise.resolve({ total: 0, trabajables: 0, autoIntegrables: 0, elegibles: 0 })
  // prettier-ignore
  Object.assign(globalThis, {
    window: { api: {
      repair: { propose: () => Promise.resolve(valor), cerco, list: vacio },
      scan: { findings: vacio }
    } }
  })
}

const avisos = (): readonly string[] => useToastStore.getState().toasts.map((t) => t.message)

beforeEach(() => {
  useToastStore.setState({ toasts: [] })
  useRepairStore.setState({ busy: false, projectId: null, proposals: [], findings: [], cerco: { total: 0, trabajables: 0, autoIntegrables: 0, elegibles: 0 } }) // prettier-ignore
})

/**
 * Sobre un proyecto de CLIENTE el aviso no puede ser «no hay nada que reparar»:
 * es falso, y ademas no le dice a donde ir. El cartel de MotorView ya lo evita
 * en pantalla, pero el canal sigue siendo llamable (ADR-107).
 */
describe('proposeRepair sobre un proyecto que no es del Motor', () => {
  it('dice que va por el Terminal, no que no haya nada', async () => {
    stubRepair({ ok: true, value: { ok: false, reason: 'no-es-su-vehiculo' } })
    await proposeRepair('proj')

    expect(avisos()[0]).toContain('Terminal')
    expect(avisos()[0]).not.toContain('No hay hallazgo que reparar')
  })
})
