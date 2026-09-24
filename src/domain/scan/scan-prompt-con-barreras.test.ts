import { describe, expect, it } from 'vitest'
import { buildScanPrompt } from './scan-prompt'

const SIN_CORPUS = { docs: [], directories: [] }
const BARRERAS = ['Barreras que este proyecto declara (1 hooks PreToolUse; .fortress/config ausente):', '- Write|Edit -> proteger-invariantes.py (python: NO arranca)'] // prettier-ignore

describe('el prompt de la parada lleva las barreras declaradas (ADR-104 §3)', () => {
  it('con barreras, el bloque va antes de las reglas y despues de la memoria', () => {
    const p = buildScanPrompt('P', SIN_CORPUS, ['src'], undefined, ['src/a.ts:1 otro'], BARRERAS)
    const barreras = p.indexOf('Barreras que este proyecto declara')
    expect(barreras).toBeGreaterThan(p.indexOf('ya tiene registrado'))
    expect(barreras).toBeLessThan(p.indexOf('Reglas:'))
    expect(p).toContain('- Write|Edit -> proteger-invariantes.py (python: NO arranca)')
  })

  it('sin barreras, el prompt es el de ayer', () => {
    expect(buildScanPrompt('P', SIN_CORPUS, ['src'])).not.toContain(
      'Barreras que este proyecto declara'
    )
    expect(buildScanPrompt('P', SIN_CORPUS, ['src'], undefined, [], [])).toBe(buildScanPrompt('P', SIN_CORPUS, ['src'])) // prettier-ignore
  })
})
