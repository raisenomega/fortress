import { describe, expect, it } from 'vitest'
import { EMPTY_USAGE } from '@domain/telemetry/token-usage'
import { esRunVacio } from './salida-del-analista'

describe('esRunVacio: el modelo no corrio, distinto de ilegible (GAP B)', () => {
  it('salida vacia, sin factura ni modelo = run-vacío', () => {
    // Mutante: `esRunVacio -> return false` -> el "" vuelve a toAnalysis -> ILEGIBLE.
    expect(esRunVacio({ result: '' })).toBe(true)
  })

  it('invariante 4: un run REAL con prosa (usage y modelo) NO es run-vacío', () => {
    // Corrió y soltó algo no-JSON: eso SÍ es ilegible. El chequeo no lo captura.
    expect(esRunVacio({ result: 'API Error 529', usage: EMPTY_USAGE, modelos: ['claude-opus-4-8'] })).toBe(false) // prettier-ignore
  })

  it('un CLI que no arranco NO es run-vacío: su marca (noArranco) gana', () => {
    expect(esRunVacio({ result: '', noArranco: true })).toBe(false)
  })
})
