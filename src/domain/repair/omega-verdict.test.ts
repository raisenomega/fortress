import { describe, expect, it } from 'vitest'
import { computeGlobalVerdict, type OmegaAxes } from './omega-verdict'

const BENIGNO: OmegaAxes = {
  resuelve_el_hallazgo: 'SI',
  respeta_scope: 'SI',
  respeta_doNotTouch: 'SI',
  calidad_del_diff: 'BUENO',
  riesgo_residual: 'NINGUNO'
}

describe('computeGlobalVerdict (D19: el motor computa, el agente evidencia)', () => {
  it('todo benigno: APROBADO', () => {
    expect(computeGlobalVerdict(BENIGNO)).toBe('APROBADO')
  })

  it('los 4 caminos duros a VETADO, uno por regla', () => {
    expect(computeGlobalVerdict({ ...BENIGNO, resuelve_el_hallazgo: 'NO' })).toBe('VETADO')
    expect(computeGlobalVerdict({ ...BENIGNO, respeta_scope: 'NO' })).toBe('VETADO')
    expect(computeGlobalVerdict({ ...BENIGNO, respeta_doNotTouch: 'NO' })).toBe('VETADO')
    expect(computeGlobalVerdict({ ...BENIGNO, riesgo_residual: 'MAYOR' })).toBe('VETADO')
  })

  it('el borde que importa: PARCIAL + RUIDOSO + MENOR degradan pero NO vetan', () => {
    expect(
      computeGlobalVerdict({
        resuelve_el_hallazgo: 'PARCIAL',
        respeta_scope: 'SI',
        respeta_doNotTouch: 'SI',
        calidad_del_diff: 'RUIDOSO',
        riesgo_residual: 'MENOR'
      })
    ).toBe('APROBADO')
  })
})
