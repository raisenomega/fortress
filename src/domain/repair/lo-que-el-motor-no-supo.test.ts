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

/**
 * La otra mitad, en su fichero porque el de al lado llego al tope: lo que el
 * libro NO tiene se DICE, nunca se adivina ni se recalcula.
 */
describe('y cuando NO esta en el libro lo DICE, no lo adivina', () => {
  it('una propuesta anterior al asiento: sin correa registrada', () => {
    // Doctrina de la factura ausente: una factura que falta NO es una de ceros.
    // Recalcular la correa daria una lista que puede no ser la que se aplico, y
    // el revisor juzgaria contra una correa que nunca existio.
    const texto = loQueElMotorSupo([GATE]).join('\n')

    expect(texto).toContain('sin correa registrada')
  })

  it('una propuesta que no llego al gate: sin gate registrado', () => {
    expect(loQueElMotorSupo([CORREA]).join('\n')).toContain('sin gate registrado')
  })

  it('el libro vacio lo dice todo, y no se calla ninguna de las dos', () => {
    const texto = loQueElMotorSupo([]).join('\n')

    expect(texto).toContain('sin correa registrada')
    expect(texto).toContain('sin gate registrado')
  })

  it('una evidencia ilegible no se inventa: cuenta como no registrada', () => {
    const roto = ev({ reason: MOTIVO_CORREA, evidenceJson: '{no es json' })

    expect(loQueElMotorSupo([roto]).join('\n')).toContain('sin correa registrada')
  })

  it('y la del GATE ilegible dice «sin registrar», JAMAS «no verde»', () => {
    // Un JSON roto no es un gate que fallo. Decir «NO verde» sobre un gate que
    // quiza paso es la misma mentira que este modulo existe para no contar.
    const roto = ev({ phase: 'GATE', toState: 'GATE', evidenceJson: '{roto' })
    const texto = loQueElMotorSupo([roto]).join('\n')

    expect(texto).toContain('sin gate registrado')
    expect(texto).not.toContain('NO verde')
  })
})
