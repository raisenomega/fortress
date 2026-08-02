import { describe, expect, it } from 'vitest'
import { scoreBand } from '../project/fortress-score'
import type { Severity } from '../shared/severity'
import { scoreFromFindings } from './score-from-findings'

const findings = (...severities: Severity[]): { severity: Severity }[] =>
  severities.map((severity) => ({ severity }))

describe('scoreFromFindings', () => {
  it('da 100 a un proyecto sin hallazgos', () => {
    expect(scoreFromFindings([])).toBe(100)
  })

  it('resta mas cuanto mas grave es el hallazgo', () => {
    expect(scoreFromFindings(findings('LOW'))).toBe(99)
    expect(scoreFromFindings(findings('MEDIUM'))).toBe(97)
    expect(scoreFromFindings(findings('HIGH'))).toBe(92)
  })

  it('nunca baja de cero por muchos hallazgos que haya', () => {
    expect(scoreFromFindings(findings(...Array<Severity>(20).fill('CRITICAL')))).toBe(0)
  })

  it('es determinista: los mismos hallazgos dan el mismo numero', () => {
    const uno = scoreFromFindings(findings('HIGH', 'MEDIUM', 'LOW'))
    const dos = scoreFromFindings(findings('LOW', 'HIGH', 'MEDIUM'))
    expect(uno).toBe(dos)
  })

  it('un solo CRITICAL empuja el score a la banda de riesgo', () => {
    // Sin techo serian 75 (verde) y push bloqueado a la vez: incoherente.
    const score = scoreFromFindings(findings('CRITICAL'))
    expect(score).toBe(64)
    expect(scoreBand(score)).toBe('riesgo')
  })

  it('el techo no sube el score de un proyecto que ya estaba peor', () => {
    expect(scoreFromFindings(findings('CRITICAL', 'CRITICAL', 'CRITICAL'))).toBe(25)
  })
})
