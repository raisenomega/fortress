import { describe, expect, it } from 'vitest'
import type { CodeAgentReply } from '@domain/chat/code-agent'
import { createRunAccumulator } from './run-accumulator'
import { parseStreamLine } from './stream-events'

/**
 * La linea REAL que devolvio el CLI 2.1.272 al pedirle `--resume` de una sesion
 * que no existe (2026-09-15), recortada a las llaves que importan. Trae un
 * session_id NUEVO —no el pedido— y `num_turns: 0`: por eso la memoria mira los
 * turnos y no solo si hay id.
 */
const RESUME_ROTO = JSON.stringify({
  type: 'result',
  subtype: 'error_during_execution',
  is_error: true,
  num_turns: 0,
  session_id: 'd9c90eec-1b2e-46b4-956c-9136ca4e2980',
  total_cost_usd: 0,
  errors: ['No conversation found with session ID: 00000000-0000-4000-8000-000000000000']
})

const BUENO = JSON.stringify({ type: 'result', subtype: 'success', result: 'ok', num_turns: 3, session_id: 'ses-1' }) // prettier-ignore
const SIN_SESION = JSON.stringify({ type: 'result', subtype: 'success', result: 'ok' })

describe('la sesion sale del evento final del stream, y nada se inventa', () => {
  it('un final bueno trae su sesion y sus turnos', () => {
    expect(parseStreamLine(BUENO)).toMatchObject({ sessionId: 'ses-1', turns: 3 })
  })

  it('el --resume roto real: id nuevo, cero turnos y fallido', () => {
    const e = parseStreamLine(RESUME_ROTO)
    expect(e).toMatchObject({ failed: true, turns: 0 })
    expect(e?.sessionId).toBe('d9c90eec-1b2e-46b4-956c-9136ca4e2980')
  })

  it('si el evento no los trae, las llaves ni aparecen', () => {
    const e = parseStreamLine(SIN_SESION) ?? {}
    expect('sessionId' in e).toBe(false)
    expect('turns' in e).toBe(false)
  })
})

describe('el acumulador los pasa a la respuesta tal cual', () => {
  const respuesta = (linea: string, codigo: number): CodeAgentReply => {
    const acc = createRunAccumulator(() => undefined)
    acc.absorb(linea)
    return acc.toReply(codigo)
  }

  it('turno bueno: la respuesta lleva sesion y turnos', () => {
    expect(respuesta(BUENO, 0)).toMatchObject({ failed: false, sessionId: 'ses-1', turns: 3 })
  })

  it('--resume roto: fallida, con el id falso y cero turnos, para que se reconozca', () => {
    expect(respuesta(RESUME_ROTO, 1)).toMatchObject({ failed: true, turns: 0 })
  })

  it('sin sesion en el evento, la respuesta no la inventa', () => {
    expect('sessionId' in respuesta(SIN_SESION, 0)).toBe(false)
  })
})
