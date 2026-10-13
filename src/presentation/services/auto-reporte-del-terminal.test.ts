import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useLazoStore } from '../stores/lazo-store'
import { useScanStore } from '../stores/scan-store'
import { ESPERA_DEL_SALTO_MS, useSaltoStore } from '../stores/salto-store'
import { useSettingsStore } from '../stores/settings-store'
import { autoReporteDelTerminal } from './auto-reporte-del-terminal'
import { reportarAlChat } from './reporte-del-turno'
import { submitConstruir } from './construir-service'
import { comitearDelLazo } from './comitear-del-lazo'
import { avanzarCola } from './avanzar-cola'

vi.mock('./reporte-del-turno', () => ({ reportarAlChat: vi.fn() }))
vi.mock('./construir-service', () => ({ submitConstruir: vi.fn() }))
vi.mock('./comitear-del-lazo', () => ({ comitearDelLazo: vi.fn(() => Promise.resolve()) }))
vi.mock('./avanzar-cola', () => ({ avanzarCola: vi.fn(() => Promise.resolve()) }))
vi.mock('./scan-service', () => ({ loadCounts: vi.fn(() => Promise.resolve()) }))
vi.mock('./dirigir-al-cto', () => ({ dirigirAlCto: vi.fn() }))

const PID = 'p1'
const UN_VIVO = { CRITICAL: 1, HIGH: 0, MEDIUM: 0, LOW: 0 }

beforeEach(() => {
  vi.useFakeTimers()
  useSettingsStore.setState({ mode: 'autonomo' })
  useScanStore.setState({ counts: { [PID]: UN_VIVO } })
  useLazoStore.getState().parar()
  useLazoStore.getState().activar()
  useSaltoStore.getState().cancelar()
  vi.clearAllMocks()
})

afterEach(() => {
  useSaltoStore.getState().cancelar()
  useLazoStore.getState().parar()
  vi.useRealTimers()
})

describe('autoReporteDelTerminal: la vuelta Terminal->CTO (2b-b/A-4/A-5)', () => {
  it('T1: autonomo + lazo activo -> tras 5s reporta al CTO y lo envia', async () => {
    autoReporteDelTerminal(PID)
    expect(reportarAlChat).not.toHaveBeenCalled() // la ventana aun corre
    await vi.advanceTimersByTimeAsync(ESPERA_DEL_SALTO_MS)
    expect(reportarAlChat).toHaveBeenCalledWith(PID)
    expect(submitConstruir).toHaveBeenCalledWith(PID)
  })
  it('A-4/A-5: con cabeza, el cierre COMMITEA y AVANZA (pop) antes de reportar', async () => {
    useLazoStore.getState().congelarCola(['A', 'B'])
    autoReporteDelTerminal(PID)
    await vi.advanceTimersByTimeAsync(ESPERA_DEL_SALTO_MS)
    expect(comitearDelLazo).toHaveBeenCalledWith(PID)
    expect(avanzarCola).toHaveBeenCalledWith(PID, 'A') // la cabeza trabajada
  })
  it('T1: Detener dentro de la ventana -> no vuelve', async () => {
    autoReporteDelTerminal(PID)
    useSaltoStore.getState().cancelar()
    await vi.advanceTimersByTimeAsync(ESPERA_DEL_SALTO_MS)
    expect(reportarAlChat).not.toHaveBeenCalled()
  })
  it('supervisado / lazo INACTIVO -> no vuelve', () => {
    useSettingsStore.setState({ mode: 'supervisado' })
    autoReporteDelTerminal(PID)
    useSettingsStore.setState({ mode: 'autonomo' })
    useLazoStore.getState().parar()
    autoReporteDelTerminal(PID)
    vi.advanceTimersByTime(ESPERA_DEL_SALTO_MS)
    expect(reportarAlChat).not.toHaveBeenCalled()
  })

  it('T2: cada vuelta sube el contador', async () => {
    expect(useLazoStore.getState().iteraciones).toBe(0)
    autoReporteDelTerminal(PID)
    await vi.advanceTimersByTimeAsync(ESPERA_DEL_SALTO_MS)
    expect(useLazoStore.getState().iteraciones).toBe(1)
  })
})
