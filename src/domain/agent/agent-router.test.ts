import { describe, expect, it } from 'vitest'
import { AGENT_IDS, type AgentId } from './agent'
import { routeToAgent } from './agent-router'

const ALL: readonly AgentId[] = AGENT_IDS

describe('routeToAgent', () => {
  it('enruta una peticion de seguridad al security-reviewer', () => {
    expect(routeToAgent('revisa la seguridad del login', ALL)).toBe('security-reviewer')
  })

  it('enruta una limpieza al refactor-cleaner', () => {
    expect(routeToAgent('limpia el codigo muerto', ALL)).toBe('refactor-cleaner')
  })

  it('enruta tests al tdd-guide', () => {
    expect(routeToAgent('escribe tests para el carrito', ALL)).toBe('tdd-guide')
  })

  it('ignora mayusculas', () => {
    expect(routeToAgent('REVISA LA SEGURIDAD', ALL)).toBe('security-reviewer')
  })

  it('nunca elige un agente deshabilitado', () => {
    const enabled: readonly AgentId[] = ['tdd-guide', 'planner']
    expect(enabled).toContain(routeToAgent('revisa la seguridad', enabled))
  })

  it('cae al primer agente habilitado si nada coincide', () => {
    const enabled: readonly AgentId[] = ['planner', 'cognition']
    expect(routeToAgent('hola que tal', enabled)).toBe('planner')
  })

  it('devuelve un agente valido aunque no haya ninguno habilitado', () => {
    expect(AGENT_IDS).toContain(routeToAgent('hola', []))
  })
})
