import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useLazoStore } from '../stores/lazo-store'
import { ESPERA_DEL_SALTO_MS, useSaltoStore } from '../stores/salto-store'
import { useSettingsStore } from '../stores/settings-store'
import { autoReporteDelTerminal, MAX_VUELTAS_DEFECTO } from './auto-reporte-del-terminal'
import { reportarAlChat } from './reporte-del-turno'
import { submitConstruir } from './construir-service'

vi.mock('./reporte-del-turno', () => ({ reportarAlChat: vi.fn() }))
vi.mock('./construir-service', () => ({ submitConstruir: vi.fn() }))

const PID = 'p1'

beforeEach(() => {
  vi.useFakeTimers()
  useSettingsStore.setState({ mode: 'autonomo' })
  useLazoStore.getState().parar()
  useLazoStore.getState().activar() // el lazo esta corriendo
  useSaltoStore.getState().cancelar()
  vi.mocked(reportarAlChat).mockClear()
  vi.mocked(submitConstruir).mockClear()
})

afterEach(() => {
  useSaltoStore.getState().cancelar()
  useLazoStore.getState().parar()
  vi.useRealTimers()
})

describe('autoReporteDelTerminal: la vuelta Terminal->CTO del lazo (2b-b)', () => {
  it('T1: autonomo + lazo activo -> tras 5s reporta al CTO y lo envia', () => {
    autoReporteDelTerminal(PID)
    expect(reportarAlChat).not.toHaveBeenCalled() // la ventana aun corre
    vi.advanceTimersByTime(ESPERA_DEL_SALTO_MS)
    expect(reportarAlChat).toHaveBeenCalledWith(PID)
    expect(submitConstruir).toHaveBeenCalledWith(PID)
  })

  it('T1: Detener (cancelar) dentro de la ventana -> no vuelve', () => {
    autoReporteDelTerminal(PID)
    useSaltoStore.getState().cancelar()
    vi.advanceTimersByTime(ESPERA_DEL_SALTO_MS)
    expect(reportarAlChat).not.toHaveBeenCalled()
  })

  it('T1: supervisado -> no vuelve', () => {
    useSettingsStore.setState({ mode: 'supervisado' })
    autoReporteDelTerminal(PID)
    vi.advanceTimersByTime(ESPERA_DEL_SALTO_MS)
    expect(reportarAlChat).not.toHaveBeenCalled()
  })

  it('lazo INACTIVO (envio manual del Terminal) -> no vuelve', () => {
    useLazoStore.getState().parar()
    autoReporteDelTerminal(PID)
    vi.advanceTimersByTime(ESPERA_DEL_SALTO_MS)
    expect(reportarAlChat).not.toHaveBeenCalled()
  })

  it('T2: cada vuelta cierra el ciclo y sube el contador', () => {
    expect(useLazoStore.getState().iteraciones).toBe(0)
    autoReporteDelTerminal(PID)
    vi.advanceTimersByTime(ESPERA_DEL_SALTO_MS)
    expect(useLazoStore.getState().iteraciones).toBe(1)
  })

  it('T3: alcanzado el tope de vueltas -> para y no vuelve', () => {
    for (let i = 0; i < MAX_VUELTAS_DEFECTO; i += 1) useLazoStore.getState().vuelta()
    autoReporteDelTerminal(PID)
    vi.advanceTimersByTime(ESPERA_DEL_SALTO_MS)
    expect(reportarAlChat).not.toHaveBeenCalled()
    expect(useLazoStore.getState().activo).toBe(false)
  })
})
