import { describe, expect, it } from 'vitest'
import type { Finding } from '@domain/project/project'
import type { Proposal } from '@domain/repair/proposal'
import type { ProposalState } from '@domain/repair/proposal'
import { colaDeFirma } from './cola-de-firma'

const prop = (id: string, state: ProposalState, findingId = 'f1', updatedAt = 1): Proposal =>
  ({ id, projectId: 'p1', findingId, state, baseSha: 'abc', createdAt: 0, updatedAt }) as Proposal

const hallazgo = (id: string, file: string): Finding =>
  ({ id, severity: 'LOW', title: 't', file, line: 1, status: 'open' }) as Finding

const ids = (cola: ReturnType<typeof colaDeFirma>): readonly string[] =>
  cola.map((item) => item.proposal.id)

describe('la cola de firma: solo lo que de verdad espera al operador', () => {
  it('entran GATE y OMEGA, y nada mas', () => {
    // GATE espera que se autorice el juicio; OMEGA, ya juzgada y aprobada,
    // espera la integracion. GENERADO aun no compilo y los terminales no
    // esperan nada: meterlos llenaria la cola de lo que no se firma.
    const todas = [
      prop('a', 'GATE'), prop('b', 'GENERADO'), prop('c', 'OMEGA'),
      prop('d', 'MERGEADO'), prop('e', 'RECHAZADO'), prop('f', 'ANALIZADO')
    ] // prettier-ignore

    expect(ids(colaDeFirma(todas, [])).slice().sort()).toEqual(['a', 'c'])
  })

  it('las aprobadas por OMEGA que estaban atascadas ya son firmables', () => {
    // Habia dieciseis esperando una puerta que no existia. Ahora entran.
    const atascadas = [prop('x', 'OMEGA'), prop('y', 'OMEGA')]
    expect(colaDeFirma(atascadas, [])).toHaveLength(2)
  })

  it('sin nada esperando la cola esta vacia', () => {
    expect(colaDeFirma([prop('a', 'GENERADO')], [])).toHaveLength(0)
  })

  it('agrupa por fichero: dos fixes del mismo sitio se firman seguidos', () => {
    const props = [
      prop('a', 'GATE', 'f-zeta'), prop('b', 'GATE', 'f-alfa'), prop('c', 'GATE', 'f-zeta2')
    ] // prettier-ignore
    const finds = [
      hallazgo('f-zeta', 'src/z.ts'), hallazgo('f-alfa', 'src/a.ts'), hallazgo('f-zeta2', 'src/z.ts')
    ] // prettier-ignore

    expect(ids(colaDeFirma(props, finds))).toEqual(['b', 'a', 'c'])
  })

  it('a igual fichero manda la mas vieja: se atiende por orden de espera', () => {
    const props = [prop('nueva', 'GATE', 'f1', 20), prop('vieja', 'GATE', 'f1', 10)]

    expect(ids(colaDeFirma(props, [hallazgo('f1', 'src/a.ts')]))).toEqual(['vieja', 'nueva'])
  })

  it('trae el hallazgo pegado, y aguanta que ya no exista', () => {
    const [conHallazgo] = colaDeFirma([prop('a', 'GATE')], [hallazgo('f1', 'src/a.ts')])
    expect(conHallazgo.finding?.file).toBe('src/a.ts')

    const [huerfana] = colaDeFirma([prop('a', 'GATE')], [])
    expect(huerfana.finding).toBeUndefined()
  })
})
