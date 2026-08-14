import { describe, expect, it } from 'vitest'
import { mergeDecisionEntry, type MergeDecision } from './merge-decision'

const APROBADA = { allowed: true, reason: null, conditionFailed: null } as const

function decision(over: Partial<MergeDecision> = {}): MergeDecision {
  return {
    projectId: 'p1', proposalId: '1225c9a7-bbbb', severity: 'LOW', files: ['src/a.ts'],
    diffLines: 8, policy: APROBADA, configError: null, gate: null, omega: null,
    commitSha: null, ...over
  } // prettier-ignore
}

/**
 * La configuracion ilegible no es un bloqueo mas: es el freno mas temprano de
 * la cadena, y lo que lo distingue no es una etiqueta sino la AUSENCIA de
 * politica evaluada. Un lector del libro ve la diferencia sin interpretar
 * texto, igual que la ve con un gate o un revisor nulos.
 */
describe('mergeDecisionEntry: la politica que no se llego a evaluar', () => {
  const rota = decision({ policy: null, configError: 'no es JSON valido' })

  it('cita el motivo del parser, no un bloqueo de politica', () => {
    const e = mergeDecisionEntry(rota)
    expect(e.verdict).toBe('veto')
    expect(e.summary).toContain('configuracion ilegible')
    expect(e.summary).toContain('no es JSON valido')
  })

  it('no dice "politica" cuando la politica nunca corrio', () => {
    expect(mergeDecisionEntry(rota).summary).not.toContain('por politica —')
  })

  it('la evidencia omite la condicion: no hubo ninguna que fallara', () => {
    expect(mergeDecisionEntry(rota).evidence).not.toContain('condicion=')
  })

  it('la configuracion se evalua ANTES de tocar la politica: null no revienta', () => {
    // Sin la rama previa, leer policy.reason lanzaria TypeError aqui.
    expect(() => mergeDecisionEntry(rota)).not.toThrow()
  })

  it('sin politica y sin error de config, cae a un motivo honesto en vez de romper', () => {
    const raro = decision({ policy: null, configError: null })
    expect(mergeDecisionEntry(raro).summary).toContain('no se llego a evaluar')
  })

  it('el caso normal no cambia: con politica evaluada, manda la politica', () => {
    const bloqueada = { allowed: false, reason: 'x excluido', conditionFailed: 'blacklist' } as const // prettier-ignore
    const e = mergeDecisionEntry(decision({ policy: bloqueada }))
    expect(e.summary).toContain('politica')
    expect(e.evidence).toContain('condicion=blacklist')
  })
})
