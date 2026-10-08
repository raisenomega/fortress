import { describe, expect, it } from 'vitest'
import type { ChatMessage } from './chat-message'
import { DOC_OPEN } from './config-docs'
import { buildConfigurationPrompt } from './configuration-prompt'

function msg(role: ChatMessage['role'], content: string): ChatMessage {
  return {
    id: 'm',
    projectId: 'p1',
    chatId: null,
    role,
    content,
    agentId: null,
    mode: 'supervisado',
    engine: 'claude-code',
    createdAt: '2026',
    pending: false
  }
}

describe('buildConfigurationPrompt', () => {
  it('prohibe escribir en disco y fija el orden y el envelope', () => {
    const prompt = buildConfigurationPrompt([], 'MiApp')
    expect(prompt).toContain('SOLO LECTURA')
    expect(prompt).toContain('NO escribas')
    expect(prompt).toContain('CONSTITUTION.md')
    expect(prompt).toContain(DOC_OPEN)
    expect(prompt).toContain('MiApp')
  })

  it('sin historial pide la PRIMERA pregunta', () => {
    expect(buildConfigurationPrompt([], 'MiApp')).toContain('PRIMERA pregunta')
  })

  it('incrusta la conversacion previa para el turno stateless', () => {
    const prompt = buildConfigurationPrompt(
      [msg('user', 'es un SaaS'), msg('assistant', 'ok')],
      'X'
    )
    expect(prompt).toContain('Operador: es un SaaS')
    expect(prompt).toContain('FORTRESS: ok')
  })
})
