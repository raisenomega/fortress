import { describe, expect, it } from 'vitest'
import { cortaElTurno, seVerifico, type VerificacionDelArbol } from './verificacion-del-arbol'

const TODOS: readonly VerificacionDelArbol[] = ['verde', 'rojo', 'desconocida']

/**
 * ADR-091. El booleano no podia decir «no lo se», y esa ambiguedad costo un
 * turno entero el 18-sep: `false` significaba a la vez «tu fix rompio esto» y
 * «aqui no hay con que compilar». Estos tests fijan que las tres cosas son
 * TRES, y sobre todo que `desconocida` no se pueda leer como ninguna de las
 * otras dos.
 */
describe('el arbol tiene tres respuestas, no dos', () => {
  it('solo el ROJO tumba el turno', () => {
    expect(TODOS.filter(cortaElTurno)).toEqual(['rojo'])
  })

  it('solo el VERDE cuenta como verificado', () => {
    expect(TODOS.filter(seVerifico)).toEqual(['verde'])
  })

  it('DESCONOCIDA no tumba, y tampoco absuelve: no es verde ni rojo', () => {
    // Es el corazon del ADR. Si algun dia una de estas dos cambia, lo que se
    // rompe no es un test: es la promesa de que nadie conserva creyendo que
    // se verifico, ni revierte un fix por un terreno que no se pudo medir.
    expect(cortaElTurno('desconocida')).toBe(false)
    expect(seVerifico('desconocida')).toBe(false)
  })

  it('y no hay forma de juntarla con el verde: son preguntas distintas', () => {
    // `seVerifico` no es `!cortaElTurno`. Si lo fuera, desconocida colaria por
    // verde en cuanto alguien usara el helper equivocado.
    const comoSiFueranLoMismo = TODOS.map((v) => !cortaElTurno(v))
    expect(TODOS.map(seVerifico)).not.toEqual(comoSiFueranLoMismo)
  })
})
