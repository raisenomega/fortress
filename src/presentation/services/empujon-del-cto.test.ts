import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useLazoStore } from '../stores/lazo-store'
import { useProjectStore } from '../stores/project-store'
import { useScanStore } from '../stores/scan-store'
import { ESPERA_DEL_SALTO_MS, useSaltoStore } from '../stores/salto-store'
import { empujonAlCto } from './empujon-del-cto'
import { MAX_VUELTAS_DEFECTO } from './lazo-trabajo'
import { submitConstruir } from './construir-service'

vi.mock('./construir-service', () => ({ submitConstruir: vi.fn() }))

const PID = 'p1'
const VIVO = { CRITICAL: 1, HIGH: 0, MEDIUM: 0, LOW: 0 }
const SIN_VIVOS = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 }

beforeEach(() => {
  vi.useFakeTimers()
  useProjectStore.setState({ activeProjectId: PID })
  useScanStore.setState({ counts: { [PID]: VIVO } })
  useLazoStore.getState().parar()
  useLazoStore.getState().activar() // lazo corriendo
  useSaltoStore.getState().cancelar()
  vi.mocked(submitConstruir).mockClear()
})

afterEach(() => {
  useSaltoStore.getState().cancelar()
  useLazoStore.getState().parar()
  vi.useRealTimers()
})

describe('empujonAlCto: el empujon del lazo, pasa al siguiente (2b-c)', () => {
  it('MUTANTE CLAVE: no-PASO con trabajo y sin tope -> EMPUJA, NO para', () => {
    empujonAlCto()
    vi.advanceTimersByTime(ESPERA_DEL_SALTO_MS)
    expect(submitConstruir).toHaveBeenCalledWith(PID) // re-engancha al CTO
    expect(useLazoStore.getState().activo).toBe(true) // NO paro
    expect(useLazoStore.getState().sinAvanzar).toBe(1) // estanco +1
  })

  it('sin hallazgos vivos -> para, no empuja', () => {
    useScanStore.setState({ counts: { [PID]: SIN_VIVOS } })
    empujonAlCto()
    vi.advanceTimersByTime(ESPERA_DEL_SALTO_MS)
    expect(submitConstruir).not.toHaveBeenCalled()
    expect(useLazoStore.getState().activo).toBe(false)
  })

  it('estancado (ya se empujo) + sigue sin PASO -> para, no empuja de nuevo', () => {
    useLazoStore.getState().estancar() // sinAvanzar=1 >= MAX_SIN_AVANZAR
    empujonAlCto()
    vi.advanceTimersByTime(ESPERA_DEL_SALTO_MS)
    expect(submitConstruir).not.toHaveBeenCalled()
    expect(useLazoStore.getState().activo).toBe(false)
  })

  it('tope de vueltas alcanzado -> para, no empuja', () => {
    for (let i = 0; i < MAX_VUELTAS_DEFECTO; i += 1) useLazoStore.getState().vuelta()
    empujonAlCto()
    vi.advanceTimersByTime(ESPERA_DEL_SALTO_MS)
    expect(submitConstruir).not.toHaveBeenCalled()
    expect(useLazoStore.getState().activo).toBe(false)
  })

  it('lazo inactivo (no-PASO en conversacion normal) -> no empuja', () => {
    useLazoStore.getState().parar()
    empujonAlCto()
    vi.advanceTimersByTime(ESPERA_DEL_SALTO_MS)
    expect(submitConstruir).not.toHaveBeenCalled()
  })
})
