import { describe, expect, it } from 'vitest'
import type { Severity } from '../shared/severity'
import { DEFAULT_POLICY, evaluate, type ProposalDiff } from './auto-merge-policy'

function fix(over: Partial<ProposalDiff> = {}): ProposalDiff {
  return { severity: 'LOW' as Severity, files: ['src/a/b.ts'], insertions: 6, deletions: 2, ...over } // prettier-ignore
}

describe('evaluate: las cuatro condiciones acumulativas', () => {
  it('LOW, 8 lineas, 1 archivo limpio: se integra sola', () => {
    const r = evaluate(fix(), DEFAULT_POLICY)
    expect(r).toEqual({ allowed: true, reason: null, conditionFailed: null })
  })

  it('MEDIUM con 19 lineas en 5 archivos limpios: se integra sola', () => {
    const files = ['a.ts', 'b.ts', 'c.ts', 'd.ts', 'e.ts']
    const r = evaluate(fix({ severity: 'MEDIUM', files, insertions: 15, deletions: 4 }), DEFAULT_POLICY) // prettier-ignore
    expect(r.allowed).toBe(true)
  })

  it('HIGH exige firma humana, por pequeno que sea el fix', () => {
    const r = evaluate(fix({ severity: 'HIGH', insertions: 1, deletions: 0 }), DEFAULT_POLICY)
    expect(r.conditionFailed).toBe('severity')
    expect(r.reason).toContain('HIGH')
  })

  it('el tope de lineas es ESTRICTO: 20 ya no pasa', () => {
    const r = evaluate(fix({ insertions: 20, deletions: 0 }), DEFAULT_POLICY)
    expect(r.conditionFailed).toBe('diff')
  })

  it('19 lineas pasan, 21 no', () => {
    expect(evaluate(fix({ insertions: 19, deletions: 0 }), DEFAULT_POLICY).allowed).toBe(true)
    expect(evaluate(fix({ insertions: 21, deletions: 0 }), DEFAULT_POLICY).allowed).toBe(false)
  })

  it('seis archivos exceden el alcance', () => {
    const files = ['a.ts', 'b.ts', 'c.ts', 'd.ts', 'e.ts', 'f.ts']
    const r = evaluate(fix({ files }), DEFAULT_POLICY)
    expect(r.conditionFailed).toBe('files')
  })
})

describe('evaluate: la lista de exclusion y el principio 21', () => {
  it('un fix sobre las reglas de la propia autonomia no se integra solo', () => {
    const r = evaluate(fix({ files: ['src/domain/settings/permission-mode.ts'] }), DEFAULT_POLICY)
    expect(r.conditionFailed).toBe('blacklist')
    expect(r.reason).toContain('permission-mode.ts')
  })

  it('el archivo que declara la lista se cubre a si mismo', () => {
    const r = evaluate(fix({ files: ['.fortress/config'] }), DEFAULT_POLICY)
    expect(r.conditionFailed).toBe('blacklist')
  })

  it('el propio evaluador esta cubierto: no se auto-aprueba un cambio de reglas', () => {
    const r = evaluate(fix({ files: ['src/domain/repair/auto-merge-policy.ts'] }), DEFAULT_POLICY)
    expect(r.conditionFailed).toBe('blacklist')
  })

  it('un area sensible declarada con glob bloquea toda su carpeta', () => {
    expect(evaluate(fix({ files: ['src/domain/auth/u.ts'] }), DEFAULT_POLICY).allowed).toBe(false)
    expect(evaluate(fix({ files: ['db/migrations/001.sql'] }), DEFAULT_POLICY).allowed).toBe(false)
  })

  it('la exclusion es por ruta COMPLETA: el test del archivo protegido no la hereda', () => {
    const r = evaluate(fix({ files: ['src/domain/settings/permission-mode.test.ts'] }), DEFAULT_POLICY) // prettier-ignore
    expect(r.allowed).toBe(true)
  })

  it('basta UN archivo excluido para frenar el lote entero', () => {
    const files = ['src/a/b.ts', 'src/domain/loop/loop-gate.ts']
    expect(evaluate(fix({ files }), DEFAULT_POLICY).conditionFailed).toBe('blacklist')
  })
})
