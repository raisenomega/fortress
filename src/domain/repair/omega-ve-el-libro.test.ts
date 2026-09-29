import { describe, expect, it } from 'vitest'
import { EMPTY_CORPUS } from '../project/corpus-descriptor'
import { buildOmegaPrompt } from './omega-prompt'
import { loQueElMotorSupo, MOTIVO_CORREA } from './lo-que-el-motor-supo'
import type { ProposalEvent } from './proposal-event'
import type { HallazgoJuzgado } from './hallazgo-juzgado'

const plan: HallazgoJuzgado = {
  target: { title: 'Secreto en el env', file: 'api/x.ts', line: 4 },
  whatToChange: 'mover la clave', where: 'api/x.ts:4',
  patternToCopy: 'ninguno', doNotTouch: 'src/critico/**', risk: 'bajo'
} // prettier-ignore

const ev = (over: Partial<ProposalEvent>): ProposalEvent => ({
  id: 'e1', proposalId: 'p1', seq: 1, phase: 'GENERATE', eventType: 'DECISION',
  actor: 'motor', ts: 1, ...over
}) // prettier-ignore

const prompt = (motorSupo?: readonly string[]): string =>
  buildOmegaPrompt({ corpus: EMPTY_CORPUS, analysis: plan, diffText: 'd', filesPost: [], filesPre: [], ...(motorSupo === undefined ? {} : { motorSupo }) }) // prettier-ignore

/** El caso documentado del backlog (9fd9ff52): el revisor no podia saber si
 *  `account-handlers.ts` quedo fuera del diff por la correa o por omision. */
const LIBRO = [
  ev({
    reason: MOTIVO_CORREA,
    evidenceJson: JSON.stringify({ allowed: ['api/x.ts'], allows: [] })
  }),
  ev({ phase: 'GATE', eventType: 'TRANSITION', actor: 'gate', toState: 'GATE', evidenceJson: '{"allCommandsGreen":true}' }) // prettier-ignore
]

describe('OMEGA ve lo que el motor supo, en su prompt', () => {
  it('el bloque llega con la correa y el gate leidos del libro', () => {
    const texto = prompt(loQueElMotorSupo(LIBRO))

    expect(texto).toContain('<lo-que-el-motor-supo>')
    expect(texto).toContain('api/x.ts')
    expect(texto).toContain('verde')
  })

  it('el caso del backlog se DISTINGUE: un fichero fuera de la correa se ve fuera', () => {
    // `account-handlers.ts` no esta en la correa asentada, asi que el revisor ya
    // no tiene que adivinar si lo omitio el motor: la correa lo dice.
    const texto = prompt(loQueElMotorSupo(LIBRO))

    expect(texto).toContain('CORREA aplicada: api/x.ts')
    expect(texto).not.toContain('account-handlers.ts')
  })

  it('una propuesta vieja lo DICE en el prompt, no lo adivina', () => {
    const texto = prompt(loQueElMotorSupo([]))

    expect(texto).toContain('sin correa registrada')
    expect(texto).toContain('sin gate registrado')
  })

  it('el Terminal no lleva bloque, que es correcto: no tiene propuesta', () => {
    expect(prompt()).not.toContain('lo-que-el-motor-supo')
  })
})
