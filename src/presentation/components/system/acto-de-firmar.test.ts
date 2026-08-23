import { describe, expect, it } from 'vitest'
import type { ProposalState } from '@domain/repair/proposal'
import { colaDeFirma } from './cola-de-firma'
import type { Proposal } from '@domain/repair/proposal'
import { esFirmable } from './acto-de-firmar'

const TODOS: readonly ProposalState[] = [
  'ELEGIDO', 'ANALIZADO', 'GENERADO', 'GATE', 'OMEGA', 'APROBADO', 'MERGEADO', 'RECHAZADO', 'CADUCADO'
] // prettier-ignore

describe('esFirmable', () => {
  it('la fila trae boton en los dos estados que esperan al operador', () => {
    expect(esFirmable('GATE')).toBe(true)
    expect(esFirmable('OMEGA')).toBe(true)
  })

  it('y en ningun otro: lo demas no espera una firma', () => {
    // GENERADO aun no compilo; los terminales no esperan nada. Un boton ahi
    // ofreceria un acto que el motor rechazaria por transicion invalida.
    const conBoton = TODOS.filter(esFirmable)
    expect(conBoton).toEqual(['GATE', 'OMEGA'])
  })
})

describe('la cola y el boton no pueden discrepar', () => {
  const prop = (state: ProposalState): Proposal =>
    ({
      id: state,
      projectId: 'p',
      findingId: 'f',
      state,
      baseSha: 'b',
      createdAt: 0,
      updatedAt: 0
    }) as Proposal

  it('todo lo que entra en la pagina de firma trae boton, y al reves', () => {
    // Son dos listas en dos ficheros. Si se separan, la pagina ensena filas que
    // no se pueden firmar —o esconde una que si—, y no lo diria nadie.
    const enCola = colaDeFirma(TODOS.map(prop), []).map((item) => item.proposal.state)
    expect([...enCola].sort()).toEqual(TODOS.filter(esFirmable).slice().sort())
  })

  it('firmar la saca: al cambiar de estado deja la cola y pierde el boton', () => {
    const firmada = prop('MERGEADO')
    expect(colaDeFirma([firmada], [])).toHaveLength(0)
    expect(esFirmable(firmada.state)).toBe(false)
  })
})
