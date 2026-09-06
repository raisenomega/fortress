import { describe, expect, it } from 'vitest'
import { EMPTY_CORPUS } from '../project/corpus-descriptor'
import type { Agent } from './agent'
import { buildAgentsPayload } from './agent-prompt'

const base: Agent = {
  id: 'code-reviewer',
  iconName: 'search',
  name: 'Code Reviewer',
  purpose: 'Bugs y edge cases',
  enabledByDefault: true
}

const payload = (agent: Agent): Record<string, unknown> =>
  buildAgentsPayload([agent], EMPTY_CORPUS)[agent.id] as unknown as Record<string, unknown>

describe('el modelo viaja en la definicion de --agents', () => {
  it('cuando el agente lo declara, va en el payload tal cual', () => {
    expect(payload({ ...base, model: 'sonnet' }).model).toBe('sonnet')
  })

  it('cuando NO lo declara, la llave no existe — no viaja en undefined', () => {
    // `JSON.stringify` borraria un `undefined` igual, pero el objeto que recorre
    // el codigo hasta ahi diria que el campo existe y vale nada, que no es lo
    // mismo que "este agente no elige modelo". Se comprueba la LLAVE.
    const definicion = payload(base)

    expect('model' in definicion).toBe(false)
    expect(Object.keys(definicion).sort()).toEqual(['description', 'prompt'])
  })

  it('lo que ya viajaba sigue viajando', () => {
    const definicion = payload({ ...base, model: 'haiku' })

    expect(definicion.description).toBe('Bugs y edge cases')
    expect(String(definicion.prompt)).toContain('Code Reviewer')
  })

  it('un alias vacio no cuenta como declarado', () => {
    // Cadena vacia es un descuido, no una eleccion: dejarla pasar mandaria
    // `model: ""` al CLI, que es una peticion de un modelo que no existe.
    expect('model' in payload({ ...base, model: '' })).toBe(false)
  })
})
