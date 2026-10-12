import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useLazoStore } from '../stores/lazo-store'
import { useScanStore } from '../stores/scan-store'
import { ESPERA_DEL_SALTO_MS, useSaltoStore } from '../stores/salto-store'
import { useSettingsStore } from '../stores/settings-store'
import { autoReporteDelTerminal } from './auto-reporte-del-terminal'
import { MAX_VUELTAS_DEFECTO } from './lazo-trabajo'
import { reportarAlChat } from './reporte-del-turno'

vi.mock('./reporte-del-turno', () => ({ reportarAlChat: vi.fn() }))
vi.mock('./construir-service', () => ({ submitConstruir: vi.fn() }))

const PID = 'p1'
const UN_VIVO = { CRITICAL: 1, HIGH: 0, MEDIUM: 0, LOW: 0 }

beforeEach(() => {
  vi.useFakeTimers()
  useSettingsStore.setState({ mode: 'autonomo' })
  useScanStore.setState({ counts: { [PID]: UN_VIVO } })
  useLazoStore.getState().parar()
  useLazoStore.getState().activar()
  useSaltoStore.getState().cancelar()
  vi.mocked(reportarAlChat).mockClear()
})

afterEach(() => {
  useSaltoStore.getState().cancelar()
  useLazoStore.getState().parar()
  vi.useRealTimers()
})

describe('autoReporteDelTerminal: las paradas de la vuelta (2b-c)', () => {
  it('T3: alcanzado el tope de vueltas -> para y no reporta', () => {
    for (let i = 0; i < MAX_VUELTAS_DEFECTO; i += 1) useLazoStore.getState().vuelta()
    autoReporteDelTerminal(PID)
    vi.advanceTimersByTime(ESPERA_DEL_SALTO_MS)
    expect(reportarAlChat).not.toHaveBeenCalled()
    expect(useLazoStore.getState().activo).toBe(false)
  })

  it('T4: sin hallazgos vivos -> nadaQueHacer, para y no reporta', () => {
    useScanStore.setState({ counts: { [PID]: { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 } } })
    autoReporteDelTerminal(PID)
    vi.advanceTimersByTime(ESPERA_DEL_SALTO_MS)
    expect(reportarAlChat).not.toHaveBeenCalled()
    expect(useLazoStore.getState().activo).toBe(false)
  })
})
