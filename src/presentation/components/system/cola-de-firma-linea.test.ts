import { describe, expect, it } from 'vitest'
import type { Finding } from '@domain/project/project'
import type { Proposal, ProposalState } from '@domain/repair/proposal'
import { reduceMotorStatus } from '@domain/repair/motor-status'
import { colaDeFirma, sitio, type EnCola } from './cola-de-firma'

const prop = (id: string, state: ProposalState): Proposal =>
  ({
    id,
    projectId: 'p1',
    findingId: 'f1',
    state,
    baseSha: 'abc',
    createdAt: 0,
    updatedAt: 1
  }) as Proposal

const hallazgo = (file: string): Finding =>
  ({ id: 'f1', severity: 'LOW', title: 't', file, line: 1, status: 'open' }) as Finding

const item = (finding: Finding | undefined): EnCola => ({ proposal: prop('a', 'GATE'), finding })

describe('el numero del chip de firma', () => {
  it('NO es el del chip del motor', () => {
    // El chip del motor cuenta toda propuesta viva, y una que se esta
    // analizando o generando no se puede firmar. Reusar aquel numero para el
    // chip de firma prometeria cinco firmables y la pagina ensenaria dos.
    const todas = [
      prop('a', 'GATE'), prop('b', 'GENERADO'), prop('c', 'OMEGA'),
      prop('d', 'ELEGIDO'), prop('e', 'ANALIZADO')
    ] // prettier-ignore
    const motor = reduceMotorStatus(todas, false)

    expect(motor.kind === 'awaiting-review' ? motor.count : 0).toBe(5)
    expect(colaDeFirma(todas, [])).toHaveLength(2)
  })
})

describe('sitio: la linea que el operador lee para decidir', () => {
  it('dice severidad, fichero y linea', () => {
    expect(sitio(item(hallazgo('src/a.ts')))).toBe('LOW src/a.ts:1')
  })

  it('omite la linea cuando el hallazgo no la tiene', () => {
    expect(sitio(item({ ...hallazgo('src/a.ts'), line: null }))).toBe('LOW src/a.ts')
  })

  it('sin hallazgo cae al id, no a una cadena vacia', () => {
    expect(sitio(item(undefined))).toContain('hallazgo f1')
  })
})
