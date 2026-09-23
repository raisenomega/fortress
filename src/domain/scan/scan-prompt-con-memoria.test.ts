import { describe, expect, it } from 'vitest'
import { buildScanPrompt } from './scan-prompt'

const SIN_CORPUS = { docs: [], directories: [] }
const REGISTRADAS = ['src/api/pay.ts:42 confianza-en-datos-del-cliente createCheckout']

describe('el prompt de la parada lleva la memoria antes de las reglas (ADR-101, palanca 1)', () => {
  it('con registradas, el bloque va entre la checklist y las reglas, con la instruccion', () => {
    const p = buildScanPrompt('Proyecto', SIN_CORPUS, ['src/api'], undefined, REGISTRADAS)
    const memoria = p.indexOf('ya tiene registrado'),
      reglas = p.indexOf('Reglas:')
    expect(memoria).toBeGreaterThan(p.indexOf('Busca, en este orden:'))
    expect(memoria).toBeLessThan(reglas)
    expect(p).toContain('- src/api/pay.ts:42 confianza-en-datos-del-cliente createCheckout')
    expect(p).toContain('conserva su tipo y su linea')
  })

  it('sin registradas, el prompt es exactamente el de ayer', () => {
    expect(buildScanPrompt('Proyecto', SIN_CORPUS, ['src/api'])).toBe(buildScanPrompt('Proyecto', SIN_CORPUS, ['src/api'], undefined, [])) // prettier-ignore
    expect(buildScanPrompt('Proyecto', SIN_CORPUS, ['src/api'])).not.toContain(
      'ya tiene registrado'
    )
  })
})
