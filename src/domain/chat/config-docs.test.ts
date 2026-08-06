import { describe, expect, it } from 'vitest'
import { DOC_CLOSE, DOC_OPEN, DRAFTED_DOCS, parseDocBlocks } from './config-docs'

function wrap(name: string, content: string): string {
  return `${DOC_OPEN}${name}\n${content}\n${DOC_CLOSE}`
}

describe('parseDocBlocks', () => {
  it('captura un bloque bien formado', () => {
    const blocks = parseDocBlocks(`Aqui va:\n${wrap('CLAUDE.md', 'linea 1\nlinea 2')}\nlisto`)
    expect(blocks.get('CLAUDE.md')).toBe('linea 1\nlinea 2')
  })

  it('captura varios bloques en un mismo texto', () => {
    const text = `${wrap('CONSTITUTION.md', 'ley')}\n\n${wrap('DDD-RULES.md', 'capas')}`
    const blocks = parseDocBlocks(text)
    expect(blocks.size).toBe(2)
    expect(blocks.get('DDD-RULES.md')).toBe('capas')
  })

  it('una re-propuesta del mismo doc pisa la anterior', () => {
    const blocks = parseDocBlocks(`${wrap('CLAUDE.md', 'v1')}\n${wrap('CLAUDE.md', 'v2')}`)
    expect(blocks.get('CLAUDE.md')).toBe('v2')
  })

  it('un texto sin envelope no captura nada', () => {
    expect(parseDocBlocks('solo una pregunta de la entrevista, sin docs').size).toBe(0)
  })

  it('el orden de aprobacion son los 7 documentos del marco', () => {
    expect(DRAFTED_DOCS[0]).toBe('CONSTITUTION.md')
    expect(DRAFTED_DOCS).toHaveLength(7)
  })
})
