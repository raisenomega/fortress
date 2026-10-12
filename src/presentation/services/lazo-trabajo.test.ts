import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { useLazoStore } from '../stores/lazo-store'
import { useScanStore } from '../stores/scan-store'
import { MAX_SIN_AVANZAR, nadaQueHacerAhora } from './lazo-trabajo'

const PID = 'p1'
const VIVO = { CRITICAL: 1, HIGH: 0, MEDIUM: 0, LOW: 0 }
const SIN_VIVOS = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 }

beforeEach(() => {
  useLazoStore.getState().parar()
  useLazoStore.getState().activar()
  useScanStore.setState({ counts: {} })
})

afterEach(() => useLazoStore.getState().parar())

describe('nadaQueHacerAhora: alimenta el nadaQueHacer del lazo (2b-c)', () => {
  it('sin projectId -> nada que hacer', () => {
    expect(nadaQueHacerAhora(null)).toBe(true)
  })

  it('sin hallazgos vivos -> nada que hacer', () => {
    useScanStore.setState({ counts: { [PID]: SIN_VIVOS } })
    expect(nadaQueHacerAhora(PID)).toBe(true)
  })

  it('con hallazgos vivos y sin estancamiento -> HAY trabajo', () => {
    useScanStore.setState({ counts: { [PID]: VIVO } })
    expect(nadaQueHacerAhora(PID)).toBe(false)
  })

  it('estancado (ya se empujo MAX_SIN_AVANZAR) -> nada que hacer aunque haya vivos', () => {
    useScanStore.setState({ counts: { [PID]: VIVO } })
    for (let i = 0; i < MAX_SIN_AVANZAR; i += 1) useLazoStore.getState().estancar()
    expect(nadaQueHacerAhora(PID)).toBe(true)
  })
})
