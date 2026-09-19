import { describe, expect, it } from 'vitest'
import { SETTINGS_KEYS } from '@domain/settings/settings-repository'
import type { SendMessageInput } from '../chat/send-message-types'
import type { AppContext } from '../context'
import { esAutonomoDeVerdad, modoGuardado } from './modo-guardado'

/** Un contexto cuya base dice lo que se le diga. */
const conBase = (guardado: string | null): AppContext =>
  ({
    settings: { get: (k: string) => (k === SETTINGS_KEYS.operationMode ? guardado : null) }
  }) as unknown as AppContext

/** Lo que el renderer compone. Puede decir lo que quiera. */
const mensajeQueDice = (mode: 'autonomo' | 'supervisado'): SendMessageInput =>
  ({ projectId: 'p1', prompt: 'x', mode, excludedAgents: [] }) as SendMessageInput

/**
 * ADR-097 §4. El cimiento de la puerta cerrada: de donde sale el «¿es
 * autonomo?» del que dependera «no se ejecuta sin aprobacion».
 */
describe('el modo se lee de la BASE', () => {
  it('devuelve lo guardado', () => {
    expect(modoGuardado(conBase('autonomo'))).toBe('autonomo')
    expect(modoGuardado(conBase('supervisado'))).toBe('supervisado')
  })

  it('sin valor guardado cae en supervisado: ante la duda no se ejecuta solo', () => {
    expect(modoGuardado(conBase(null))).toBe('supervisado')
  })

  it('un valor corrupto tampoco abre: cae al lado seguro', () => {
    // Una version anterior, o alguien tocando la base a mano.
    expect(modoGuardado(conBase('AUTONOMO_TOTAL'))).toBe('supervisado')
  })
})

describe('LA TRAMPA: el mensaje no decide', () => {
  it('base autonomo + mensaje «supervisado» -> AUTONOMO', () => {
    // Es EXACTAMENTE lo que pasa hoy en el turno de plan del lote: el renderer
    // manda `mode: 'supervisado'` a proposito (lote-por-enter.ts:33) aunque el
    // proyecto corra en autonomo. Si la puerta se fiara del mensaje, ese turno
    // se la saltaria entera — y con el, cualquiera que copiase la mentira.
    const context = conBase('autonomo')
    const mensaje = mensajeQueDice('supervisado')

    expect(mensaje.mode).toBe('supervisado')
    expect(modoGuardado(context)).toBe('autonomo')
    expect(esAutonomoDeVerdad(context)).toBe(true)
  })

  it('base supervisado + mensaje «autonomo» -> SUPERVISADO', () => {
    // La trampa al reves: un mensaje no CONCEDE autonomo. Lo concede el
    // operador en su configuracion, y solo eso.
    const context = conBase('supervisado')

    expect(mensajeQueDice('autonomo').mode).toBe('autonomo')
    expect(esAutonomoDeVerdad(context)).toBe(false)
  })

  it('modoGuardado no recibe el mensaje: no puede fiarse de el aunque quiera', () => {
    // La firma es la garantia: sin `input` por parametro, no hay forma de que
    // una version futura empiece a mirarlo «solo en este caso».
    expect(modoGuardado.length).toBe(1)
  })
})
