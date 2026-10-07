import { describe, expect, it } from 'vitest'
import type { ChatMessage } from '@domain/chat/chat-message'
import { EMPTY_USAGE } from '@domain/telemetry/token-usage'
import { textOnly } from './reply-outcome'
import { salidaDelTurno } from './salida-del-turno'

/** PASO 87: el puente se ensancha — failed/edits/usage/modelo/hallazgos ya
 *  existian en el outcome del main y NO cruzaban al renderer. Datos planos. */

const msg = (content: string): ChatMessage => ({ content }) as ChatMessage
const usage = { ...EMPTY_USAGE, costUsd: 1.5 }

describe('la salida del turno carga el cierre del resultado', () => {
  it('copia failed, edits, usage y hallazgos del outcome, tal cual', () => {
    const outcome = { ...textOnly('x', usage), failed: true, edits: ['a.ts'], findings: [{}, {}, {}] } // prettier-ignore
    const salida = salidaDelTurno(msg('u'), msg('a'), 'claude-code', outcome as never, null, true)
    expect(salida.failed).toBe(true)
    expect(salida.edits).toEqual(['a.ts'])
    expect(salida.usage).toEqual(usage)
    expect(salida.hallazgos).toBe(3)
    expect(salida.sinVerificar).toBe(true)
  })

  it('el modelo del turno: el del PRIMER run (el principal), o el del outcome', () => {
    const conRun = { ...textOnly('x'), runs: [{ modelo: 'claude-opus-5-5' }, { modelo: 'claude-haiku-4-5' }] } // prettier-ignore
    expect(salidaDelTurno(msg('u'), msg('a'), 'claude-code', conRun as never, null, false).modelo).toBe('claude-opus-5-5') // prettier-ignore
    expect(salidaDelTurno(msg('u'), msg('a'), 'api', textOnly('x', usage, 'claude-opus-5-5'), null, false).modelo).toBe('claude-opus-5-5') // prettier-ignore
  })

  it('nada corrio que afirmar: el modelo queda FUERA, no inventado', () => {
    const salida = salidaDelTurno(msg('u'), msg('a'), 'api', textOnly('x'), null, false)
    expect('modelo' in salida).toBe(false)
  })
})
