import { describe, expect, it } from 'vitest'
import { mergeDecisionEntry, type MergeDecision } from './merge-decision'

const APROBADA = { allowed: true, reason: null, conditionFailed: null } as const

function decision(over: Partial<MergeDecision> = {}): MergeDecision {
  return {
    projectId: 'p1', proposalId: '288e299f-aaaa', severity: 'LOW', files: ['src/a.ts'],
    diffLines: 8, policy: APROBADA, gate: { ok: true, commands: [] }, commitSha: 'f987edbc0000',
    omega: { resuelve_el_hallazgo: 'SI', respeta_scope: 'SI', respeta_doNotTouch: 'SI',
      calidad_del_diff: 'BUENO', riesgo_residual: 'MENOR', veredicto_global: 'APROBADO',
      razon: 'fix minimo' }, ...over
  } // prettier-ignore
}

describe('mergeDecisionEntry: la decision cita lo que miro', () => {
  it('integracion aplicada: verdict ok y el commit en la evidencia', () => {
    const e = mergeDecisionEntry(decision())
    expect(e.kind).toBe('merge')
    expect(e.verdict).toBe('ok')
    expect(e.summary).toContain('aplicada')
    expect(e.evidence).toContain('commit=f987edb')
    expect(e.evidence).toContain('src/a.ts')
  })

  it('denegada por politica: cita la condicion que fallo', () => {
    const policy = { allowed: false, reason: 'x esta excluido', conditionFailed: 'blacklist' } as const // prettier-ignore
    const e = mergeDecisionEntry(decision({ policy, commitSha: null, gate: null, omega: null }))
    expect(e.verdict).toBe('veto')
    expect(e.summary).toContain('politica')
    expect(e.evidence).toContain('condicion=blacklist')
  })

  it('denegada por el gate: cita en que comando se rompio', () => {
    const gate = { ok: false, commands: [], failedAt: 'lint', reason: 'gate_failed' } as const
    const e = mergeDecisionEntry(decision({ gate, commitSha: null, omega: null }))
    expect(e.verdict).toBe('veto')
    expect(e.summary).toContain('lint')
  })

  it('denegada por el revisor: cita su razon', () => {
    const omega = { resuelve_el_hallazgo: 'NO', respeta_scope: 'SI', respeta_doNotTouch: 'SI',
      calidad_del_diff: 'BUENO', riesgo_residual: 'MENOR', veredicto_global: 'VETADO',
      razon: 'no ataca el hallazgo' } as const // prettier-ignore
    const e = mergeDecisionEntry(decision({ omega, commitSha: null }))
    expect(e.verdict).toBe('veto')
    expect(e.summary).toContain('no ataca el hallazgo')
  })

  it('el orden de los motivos sigue la cadena: la politica frena antes que el gate', () => {
    const policy = { allowed: false, reason: 'severidad HIGH', conditionFailed: 'severity' } as const // prettier-ignore
    const gate = { ok: false, commands: [], failedAt: 'lint', reason: 'gate_failed' } as const
    const e = mergeDecisionEntry(decision({ policy, gate, commitSha: null }))
    expect(e.summary).toContain('politica')
    expect(e.summary).not.toContain('lint')
  })

  it('se asienta siempre con el mismo agente, tambien al denegar', () => {
    expect(mergeDecisionEntry(decision()).agentId).toBe('sentinel-omega')
  })
})
