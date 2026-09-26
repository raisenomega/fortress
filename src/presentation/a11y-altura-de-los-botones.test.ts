import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const BOTONES = ['RepairFirmaButton', 'RepairGateButton', 'RepairGenerateButton', 'RepairRetirarButton', 'RepairRetryButton'] // prettier-ignore

/** Hallazgo b1f56215 (accesibilidad, LOW): los botones de la fila de propuestas
 *  median 19,33 px de alto; el minimo tocable es 24. `min-h-6` son 24 px. */
describe('los cinco botones de la fila de propuestas miden al menos 24 px', () => {
  it.each(BOTONES)('%s lleva min-h-6', (nombre) => {
    expect(readFileSync(`src/presentation/components/system/${nombre}.tsx`, 'utf8')).toContain(
      'min-h-6'
    )
  })
})
