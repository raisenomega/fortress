import { describe, expect, it } from 'vitest'
import { EMPTY_CORPUS } from '../project/corpus-descriptor'
import { buildChatPrompt } from './chat-prompt'

const ctx = { projectName: 'Nucleo', corpus: EMPTY_CORPUS, known: [], mode: 'supervisado' as const }

describe('buildChatPrompt', () => {
  it('NO exige el bloque JSON: es una conversacion', () => {
    // El bug: forzar el contrato de informe tiraba la respuesta del agente y
    // parecia que estaba ciego. En una pregunta se responde en prosa.
    const prompt = buildChatPrompt('¿el git esta aislado?', ctx)
    expect(prompt).not.toContain('findings')
    expect(prompt).toContain('no hace falta ningun bloque JSON')
  })

  it('incluye la pregunta del operador tal cual', () => {
    expect(buildChatPrompt('¿esta seguro?', ctx)).toContain('¿esta seguro?')
  })

  it('le da el modo y los hallazgos ya conocidos, para no reescanear', () => {
    const prompt = buildChatPrompt('x', { ...ctx, known: ['CRITICAL api.py:42 SQL injection'] })
    expect(prompt).toContain('MODO SUPERVISADO')
    expect(prompt).toContain('SQL injection')
  })

  it('con un hallazgo a resolver, SU bloque sustituye a la lista (ADR-088)', () => {
    const known = ['CRITICAL api.py:42 SQL injection']
    const prompt = buildChatPrompt('x', { ...ctx, known, enFoco: '- id: f1' })
    expect(prompt).toContain('Hallazgo a resolver')
    expect(prompt).toContain('- id: f1')
    expect(prompt).not.toContain('Hallazgos ya registrados')
    expect(prompt).not.toContain('SQL injection')
  })
})
