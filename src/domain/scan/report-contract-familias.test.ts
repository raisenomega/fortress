import { describe, expect, it } from 'vitest'
import { REPORT_CONTRACT } from './report-contract'

describe('el contrato dice que las familias de auditoria no llevan ejes (ADR-103 §2)', () => {
  it('nombra la excepcion y las seis familias', () => {
    expect(REPORT_CONTRACT).toContain('NO pongas ejes')
    for (const t of ['accesibilidad', 'privacidad', 'integridad-de-negocio', 'continuidad-y-backups', 'dependencia-vulnerable', 'criptografia-debil']) expect(REPORT_CONTRACT).toContain(t) // prettier-ignore
  })

  it('da la guia de una linea solo a las dos familias con escala (casilla 2)', () => {
    expect(REPORT_CONTRACT).toContain('WCAG')
    expect(REPORT_CONTRACT).toContain('clase de dato')
    expect(REPORT_CONTRACT).not.toMatch(/continuidad-y-backups[^\n]*:\s*(RTO|nivel)/)
  })
})
