import { describe, expect, it } from 'vitest'
import { evaluate } from './auto-merge-evaluation'
import { DEFAULT_POLICY } from './auto-merge-policy'

const ACTIVA = { ...DEFAULT_POLICY, enabled: true }
const fix = (file: string): Parameters<typeof evaluate>[0] => ({
  severity: 'LOW', files: [file], insertions: 1, deletions: 0
}) // prettier-ignore

describe('el candidato de la primera auto-reparacion sigue siendo integrable', () => {
  it('run-accumulator NO quedo bloqueado por ampliar la lista', () => {
    // Ampliar las defensas no puede cerrar de paso lo que si debe poder
    // integrarse solo: si esto se pusiera en rojo, la primera auto-reparacion
    // se habria bloqueado sin que nadie lo decidiera.
    const r = evaluate(fix('src/infrastructure/claude-code/run-accumulator.ts'), ACTIVA)
    expect(r.allowed).toBe(true)
  })
})
