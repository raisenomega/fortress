import { describe, expect, it } from 'vitest'
import type { ProposalEvent } from './proposal-event'
import { loQueElMotorSupo, MOTIVO_CORREA } from './lo-que-el-motor-supo'

const ev = (over: Partial<ProposalEvent>): ProposalEvent => ({
  id: 'e1', proposalId: 'p1', seq: 1, phase: 'GENERATE', eventType: 'DECISION',
  actor: 'motor', ts: 1, ...over
}) // prettier-ignore

const CORREA = ev({
  reason: MOTIVO_CORREA,
  evidenceJson: JSON.stringify({ allowed: ['api/x.ts', 'api/x.test.ts'], allows: ['src/nuevo/**'] })
})
const GATE = ev({
  phase: 'GATE', eventType: 'TRANSITION', actor: 'gate', toState: 'GATE', reason: 'gate verde',
  evidenceJson: JSON.stringify({ allCommandsGreen: true, totalDurationMs: 169392 })
}) // prettier-ignore

describe('el revisor LEE del libro lo que el motor supo', () => {
  it('la correa que se APLICO, tal cual quedo asentada', () => {
    const texto = loQueElMotorSupo([CORREA]).join('\n')

    expect(texto).toContain('api/x.ts')
    expect(texto).toContain('api/x.test.ts')
    expect(texto).toContain('src/nuevo/**')
  })

  it('el resultado del gate, que ya estaba en el libro sin escribir nada nuevo', () => {
    const texto = loQueElMotorSupo([GATE]).join('\n')

    expect(texto).toContain('verde')
  })

  it('los dos juntos, cada uno en su linea', () => {
    const lineas = loQueElMotorSupo([CORREA, GATE])

    expect(lineas.some((l) => l.includes('api/x.ts'))).toBe(true)
    expect(lineas.some((l) => l.includes('verde'))).toBe(true)
  })
})
