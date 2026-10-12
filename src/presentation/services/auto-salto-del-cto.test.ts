import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useLazoStore } from '../stores/lazo-store'
import { useProjectStore } from '../stores/project-store'
import { useSaltoStore } from '../stores/salto-store'
import { ESPERA_DEL_SALTO_MS } from '../stores/salto-store'
import { useSettingsStore } from '../stores/settings-store'
import { autoSaltoDelCto } from './auto-salto-del-cto'
import { enviar } from './puerta-del-envio'

vi.mock('./puerta-del-envio', () => ({ enviar: vi.fn() }))

const PASO = 'conversa...\nPASO:[reparar el CRITICAL 7]:END-PASO\ncierre'

beforeEach(() => {
  vi.useFakeTimers()
  useSettingsStore.setState({ mode: 'autonomo' })
  useProjectStore.setState({ activeProjectId: 'p1' })
  useLazoStore.getState().parar() // lazo inactivo: un no-PASO no empuja en estos tests
  useSaltoStore.getState().cancelar()
  vi.mocked(enviar).mockClear()
})

afterEach(() => {
  useSaltoStore.getState().cancelar()
  vi.useRealTimers()
})

describe('autoSaltoDelCto: salto CTO->Terminal con ventana (Sello 2b-a)', () => {
  it('T2: autonomo + PASO -> NO antes de la ventana, SI tras ella', () => {
    autoSaltoDelCto(PASO)
    expect(enviar).not.toHaveBeenCalled() // la ventana aun corre
    vi.advanceTimersByTime(ESPERA_DEL_SALTO_MS)
    expect(enviar).toHaveBeenCalledOnce()
    expect(vi.mocked(enviar).mock.calls[0][1]).toBe('reparar el CRITICAL 7')
  })

  it('MUTANTE: disparar en supervisado -> NO dispara', () => {
    useSettingsStore.setState({ mode: 'supervisado' })
    autoSaltoDelCto(PASO)
    vi.advanceTimersByTime(ESPERA_DEL_SALTO_MS)
    expect(enviar).not.toHaveBeenCalled()
  })

  it('T3: cancelar dentro de la ventana -> NO dispara', () => {
    autoSaltoDelCto(PASO)
    useSaltoStore.getState().cancelar() // == Detener en los 5s
    vi.advanceTimersByTime(ESPERA_DEL_SALTO_MS)
    expect(enviar).not.toHaveBeenCalled()
  })

  it('T4: sin bloque PASO -> NO dispara', () => {
    autoSaltoDelCto('solo converso, sin ningun bloque')
    vi.advanceTimersByTime(ESPERA_DEL_SALTO_MS)
    expect(enviar).not.toHaveBeenCalled()
  })

  it('T5: el envio pasa por el gate (enviar) con el modo del store', () => {
    autoSaltoDelCto(PASO)
    vi.advanceTimersByTime(ESPERA_DEL_SALTO_MS)
    expect(vi.mocked(enviar).mock.calls[0][0].mode).toBe('autonomo')
    expect(vi.mocked(enviar).mock.calls[0][2]).toBe(false) // configuring=false
  })
})
