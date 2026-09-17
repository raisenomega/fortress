import { describe, expect, it } from 'vitest'
import type { VeredictoDelTurno } from '@domain/chat/veredicto-del-turno'
import { conRedDeReversion } from './con-red-de-reversion'
import { redDeMentira } from './ciclo-de-convergencia-fixture'
import { textOnly, type ReplyOutcome } from './reply-outcome'

const edito = (): Promise<ReplyOutcome> =>
  Promise.resolve({ ...textOnly('hecho'), edits: ['a.ts'] })

/**
 * ADR-090: el juicio es SOLO del autonomo. En supervisado el auditor es el
 * humano —a eso fue—, y meterle encima un veto automatico le quitaria la
 * decision que vino a tomar. Sin juez, el turno se comporta exactamente como
 * antes de que esta pieza existiera: manda el gate y nadie mas.
 */
describe('supervisado: el turno no pasa por OMEGA', () => {
  it('sin juez y con gate verde conserva, sin veredicto', async () => {
    const red = redDeMentira()

    const turno = await conRedDeReversion(red, '/p', true, edito)

    expect(turno.conservado).toBe(true)
    expect(turno.veredicto).toEqual({ juzgado: false })
    expect(red.pasos).toEqual(['conservar'])
  })

  it('sin juez y con gate ROJO revierte, como siempre', async () => {
    const red = redDeMentira(false)

    const turno = await conRedDeReversion(red, '/p', true, edito)

    expect(turno.revertido).toBe(true)
    expect(red.pasos).toEqual(['revertir'])
  })

  it('el gate manda ANTES que OMEGA: en rojo no se llega a juzgar', async () => {
    const red = redDeMentira(false)
    let juzgo = false
    const juez = (): Promise<VeredictoDelTurno> => {
      juzgo = true
      return Promise.resolve({ juzgado: true, aprobado: true })
    }

    const turno = await conRedDeReversion(red, '/p', true, edito, { juez, plan: {} as never })

    expect(juzgo).toBe(false)
    expect(turno.revertido).toBe(true)
  })

  it('sin red (turno no protegido) no se conserva ni se juzga', async () => {
    const sinRed = { ...redDeMentira(), abrir: () => null }

    const turno = await conRedDeReversion(sinRed, '/p', false, edito)

    expect(turno.conservado).toBe(false)
    expect(turno.veredicto).toEqual({ juzgado: false })
  })
})
