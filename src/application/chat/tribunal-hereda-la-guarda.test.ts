import { describe, expect, it } from 'vitest'
import type { VeredictoDelTurno } from '@domain/chat/veredicto-del-turno'
import { conRedDeReversion } from './con-red-de-reversion'
import { redDeMentira } from './ciclo-de-convergencia-fixture'
import { textOnly, type ReplyOutcome } from './reply-outcome'

const edito = (): Promise<ReplyOutcome> =>
  Promise.resolve({ ...textOnly('hecho'), edits: ['a.ts'] })

const apruebaSinMirar = (): Promise<VeredictoDelTurno> =>
  Promise.resolve({ juzgado: true, aprobado: true })

/**
 * ADR-096. El tribunal se inserta DETRAS de la guarda de `arbitrar`, asi que
 * hereda su garantia: lo que no se juzga, tampoco se critica. No hace falta
 * reescribir la regla — pero si fijarla, porque el dia que alguien mueva el
 * tribunal delante de la guarda, el sintoma no seria un error: seria gastar N
 * criticos sobre un arbol que el gate ya tumbo, y nadie lo notaria.
 *
 * Vive aparte de `supervisado-sin-juez.test.ts` —donde esta el espia gemelo del
 * juez— porque ese fichero llego a 75 lineas: son la misma garantia vista desde
 * los dos lados, y cada una cabe en su sitio.
 */
describe('en rojo no se juzga NI se critica', () => {
  it('el gate tumba el turno y el tribunal no llega a correr', async () => {
    const red = redDeMentira(false)
    let criticaron = false
    const tribunal = (): Promise<readonly string[]> => {
      criticaron = true
      return Promise.resolve(['algo'])
    }

    const turno = await conRedDeReversion(red, '/p', true, edito, { juez: apruebaSinMirar, plan: {} as never, tribunal }) // prettier-ignore

    expect(criticaron).toBe(false)
    expect(turno.revertido).toBe(true)
  })
})
