import { describe, expect, it } from 'vitest'
import { REPORT_CONTRACT } from './report-contract'

/**
 * Backlog cd5dd320: «dos defectos distintos en el mismo archivo deben llevar
 * simbolos distintos» obligaba a INVENTAR sub-bloques (FortressV3.scanButton)
 * cuando varios defectos viven en el mismo componente. La identidad es
 * fichero|linea|tipo desde ADR-084 —el simbolo NO es clave—, asi que el
 * contrato debe pedir el bloque REAL, no uno fabricado para desempatar.
 */
describe('el contrato del simbolo', () => {
  it('pide el bloque REAL y permite repetirlo cuando el tipo ya separa', () => {
    expect(REPORT_CONTRACT).toContain('bloque REAL')
    expect(REPORT_CONTRACT).toContain('no inventes sub-bloques')
  })

  it('ya no exige simbolos distintos para defectos del mismo archivo', () => {
    expect(REPORT_CONTRACT).not.toContain('deben llevar simbolos distintos')
  })
})
