import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useLazoStore } from '../stores/lazo-store'
import { useProjectStore } from '../stores/project-store'
import { ESPERA_DEL_SALTO_MS, useSaltoStore } from '../stores/salto-store'
import { useSettingsStore } from '../stores/settings-store'
import { useWorkflowStore } from '../stores/workflow-store'
import { autoSaltoDelCto } from './auto-salto-del-cto'
import { enviar } from './puerta-del-envio'

vi.mock('./puerta-del-envio', () => ({ enviar: vi.fn() }))

const PASO = 'PASO:[reparar la cabeza]:END-PASO'

beforeEach(() => {
  vi.useFakeTimers()
  useSettingsStore.setState({ mode: 'autonomo' })
  useProjectStore.setState({ activeProjectId: 'p1' })
  useLazoStore.getState().parar()
  useSaltoStore.getState().cancelar()
  useWorkflowStore.getState().setFoco(null)
  vi.mocked(enviar).mockClear()
})

afterEach(() => {
  useSaltoStore.getState().cancelar()
  useWorkflowStore.getState().setFoco(null)
  vi.useRealTimers()
})

describe('el salto enfoca la cabeza de la cola (ATERRIZAJE-2)', () => {
  it('MUTANTE: con cabeza congelada -> enfoca su findingId antes de enviar (OMEGA juzgara)', () => {
    autoSaltoDelCto(PASO) // activar() resetea cola=null + programa la ventana
    useLazoStore.getState().congelarCola(['hallazgo-Y']) // el hook congela durante la ventana
    vi.advanceTimersByTime(ESPERA_DEL_SALTO_MS)
    expect(useWorkflowStore.getState().foco).toEqual({ projectId: 'p1', findingId: 'hallazgo-Y' })
    expect(enviar).toHaveBeenCalled()
  })

  it('sin cabeza (cola vacia) -> NO enfoca: el turno va como hoy, sin foco', () => {
    autoSaltoDelCto(PASO)
    useLazoStore.getState().congelarCola([])
    vi.advanceTimersByTime(ESPERA_DEL_SALTO_MS)
    expect(useWorkflowStore.getState().foco).toBeNull()
    expect(enviar).toHaveBeenCalled()
  })

  it('cola nunca cargada (null) -> NO enfoca (no rompe)', () => {
    autoSaltoDelCto(PASO)
    vi.advanceTimersByTime(ESPERA_DEL_SALTO_MS)
    expect(useWorkflowStore.getState().foco).toBeNull()
    expect(enviar).toHaveBeenCalled()
  })
})
