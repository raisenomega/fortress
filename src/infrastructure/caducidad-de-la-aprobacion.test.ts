import { beforeEach, describe, expect, it } from 'vitest'
import { aprobarLote, hallazgoAprobado, olvidarAprobacion } from './aprobacion-del-plan'

const LOTE = ['A', 'B', 'C']
const estado = (ids: readonly string[] = LOTE): readonly boolean[] =>
  ids.map((id) => hallazgoAprobado('p1', id))

beforeEach(() => olvidarAprobacion('p1'))

/**
 * BUG 1. La aprobacion de OMEGA no caducaba: los ids seguian aprobados mientras
 * viviera el proceso, asi que un segundo ensayo con los mismos hallazgos cruzaba
 * la puerta del ADR-097 §4 sin que OMEGA juzgara nada.
 *
 * Se prueban las DOS caducidades por separado, porque cierran fugas distintas:
 * (a) replanear invalida lo viejo, (b) el permiso se gasta al usarse.
 */
describe('(a) un plan NUEVO invalida el permiso viejo', () => {
  it('lo aprobado deja de estarlo, y ANTES de que haya veredicto nuevo', () => {
    aprobarLote('p1', LOTE)
    expect(estado()).toEqual([true, true, true])

    olvidarAprobacion('p1')

    expect(estado()).toEqual([false, false, false])
  })

  it('LA FUGA PARCIAL: con la seleccion cambiada, el superviviente NO pasa', () => {
    // Aprobado [A,B,C]; el operador reselecciona [A,D] y pide plan nuevo. Antes,
    // A cruzaba con el permiso viejo y D no: el lote corria a medias y parecia
    // normal. Es la forma mas dificil de leer de esta fuga.
    aprobarLote('p1', LOTE)

    olvidarAprobacion('p1')

    expect(hallazgoAprobado('p1', 'A')).toBe(false)
    expect(hallazgoAprobado('p1', 'D')).toBe(false)
  })
})

describe('la garantia sigue entera', () => {
  it('un ADELANTE nuevo vuelve a aprobar: caducar no es bloquear', () => {
    aprobarLote('p1', LOTE)
    olvidarAprobacion('p1')
    aprobarLote('p1', ['A', 'D'])

    expect(hallazgoAprobado('p1', 'A')).toBe(true)
    expect(hallazgoAprobado('p1', 'D')).toBe(true)
    expect(hallazgoAprobado('p1', 'B')).toBe(false)
  })

  it('y sin aprobacion nadie pasa: el estado de partida es cerrado', () => {
    expect(estado()).toEqual([false, false, false])
  })
})
