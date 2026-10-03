import { describe, expect, it } from 'vitest'
import { buildArgs } from './claude-cli'

const NO_AGENTS = {}
const AGENTS = { 'security-reviewer': { description: 'Audita', prompt: 'Eres el auditor' } }

describe('buildArgs con agentes', () => {
  it('inyecta las definiciones como JSON', () => {
    const built = buildArgs('hola', 'plan', AGENTS, null, 3).args
    const json = built[built.indexOf('--agents') + 1]
    expect(JSON.parse(json)['security-reviewer'].prompt).toBe('Eres el auditor')
  })

  it('despacha en el agente elegido', () => {
    const built = buildArgs('hola', 'plan', AGENTS, 'security-reviewer', 3).args
    expect(built[built.indexOf('--agent') + 1]).toBe('security-reviewer')
  })

  it('omite --agents si el proyecto ya define los suyos', () => {
    expect(buildArgs('hola', 'plan', NO_AGENTS, null, 3).args).not.toContain('--agents')
  })

  it('sin agente enrutado no fuerza ninguno', () => {
    expect(buildArgs('hola', 'plan', AGENTS, null, 3).args).not.toContain('--agent')
  })
})
