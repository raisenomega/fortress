import { describe, expect, it } from 'vitest'
import { GATE_COMMANDS, NPM_CI_TIMEOUT_MS, TAIL_CHARS } from './gate-config'
import { gatePassed } from './gate-result'

describe('gate-config (guarda contra cambios accidentales)', () => {
  it('las TRES intenciones, en ese orden, cada una con 10 min', () => {
    // `key` es la INTENCION; el nombre real del script lo resuelve el ejecutor
    // contra el package.json del proyecto (ver gate-runner).
    expect(GATE_COMMANDS.map((c) => c.key)).toEqual(['typecheck', 'lint', 'test:unit'])
    expect(GATE_COMMANDS.every((c) => c.timeoutMs === 600_000)).toBe(true)
    expect(GATE_COMMANDS.map((c) => c.args)).toEqual([
      ['run', 'typecheck'],
      ['run', 'lint'],
      ['run', 'test:unit']
    ])
  })

  it('npm ci con 15 min y colas de 2000 chars', () => {
    expect(NPM_CI_TIMEOUT_MS).toBe(900_000)
    expect(TAIL_CHARS).toBe(2000)
  })
})

describe('gate-result', () => {
  it('gatePassed distingue verde de rojo', () => {
    expect(gatePassed({ ok: true, commands: [] })).toBe(true)
    expect(gatePassed({ ok: false, commands: [], failedAt: 'lint', reason: 'gate_failed' })).toBe(false) // prettier-ignore
  })
})
