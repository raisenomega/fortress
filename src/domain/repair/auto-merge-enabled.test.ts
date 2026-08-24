import { describe, expect, it } from 'vitest'
import type { Severity } from '../shared/severity'
import { DEFAULT_POLICY, evaluate, type ProposalDiff } from './auto-merge-policy'
import { parseAutoMergeConfig } from './auto-merge-config'

const ACTIVA = { ...DEFAULT_POLICY, enabled: true }

function fix(over: Partial<ProposalDiff> = {}): ProposalDiff {
  return { severity: 'LOW' as Severity, files: ['src/a/b.ts'], insertions: 6, deletions: 2, lineasPorFichero: {}, ...over } // prettier-ignore
}

/**
 * El interruptor es la red que decide si el sistema puede hacer dano el dia
 * que se estrene. Nace apagado y encenderlo es un acto humano escrito en un
 * archivo que la propia lista de exclusion cubre.
 */
describe('evaluate: el interruptor corta antes que nada', () => {
  it('la politica por defecto nace APAGADA', () => {
    expect(DEFAULT_POLICY.enabled).toBe(false)
  })

  it('apagado, ni el fix mas inocente se integra solo', () => {
    const r = evaluate(fix(), DEFAULT_POLICY)
    expect(r.allowed).toBe(false)
    expect(r.conditionFailed).toBe('disabled')
  })

  it('apagado corta ANTES de mirar severidad, tamano o rutas', () => {
    // Un fix que fallaria por tres condiciones a la vez reporta solo el interruptor.
    const malo = fix({ severity: 'CRITICAL', insertions: 999, files: ['.fortress/config'] })
    expect(evaluate(malo, DEFAULT_POLICY).conditionFailed).toBe('disabled')
  })

  it('encendido, las demas condiciones vuelven a mandar', () => {
    expect(evaluate(fix(), ACTIVA).allowed).toBe(true)
    expect(evaluate(fix({ severity: 'HIGH' }), ACTIVA).conditionFailed).toBe('severity')
  })

  it('basta UN archivo excluido para frenar el lote entero', () => {
    const files = ['src/a/b.ts', 'src/domain/loop/loop-gate.ts']
    expect(evaluate(fix({ files }), ACTIVA).conditionFailed).toBe('blacklist')
  })
})

describe('parseAutoMergeConfig: el interruptor declarado', () => {
  const json = (autoMerge: unknown): string => JSON.stringify({ autoMerge })

  it('sin declararlo, hereda el default apagado', () => {
    const e = parseAutoMergeConfig(json({}))
    expect(e.kind === 'valid' && e.policy.enabled).toBe(false)
  })

  it('declarado en true, se enciende', () => {
    const e = parseAutoMergeConfig(json({ enabled: true }))
    expect(e.kind === 'valid' && e.policy.enabled).toBe(true)
  })

  it('un valor que no es booleano invalida el archivo entero', () => {
    expect(parseAutoMergeConfig(json({ enabled: 'si' })).kind).toBe('invalid')
    expect(parseAutoMergeConfig(json({ enabled: 1 })).kind).toBe('invalid')
  })
})
