import { describe, expect, it } from 'vitest'
import { buildRepairPrompt } from './repair-prompt'

describe('buildRepairPrompt', () => {
  it('ordena EDITAR para arreglar, no solo reportar', () => {
    const prompt = buildRepairPrompt('Nucleo', ['HIGH src/a.ts: fuga'])
    expect(prompt).toContain('ARREGLA')
    expect(prompt).toContain('EDITANDO')
    expect(prompt).toContain('HIGH src/a.ts: fuga')
  })

  it('manda verificar y revertir si rompe', () => {
    const prompt = buildRepairPrompt('Nucleo', [])
    expect(prompt).toContain('npm run typecheck')
    expect(prompt).toContain('revierte')
  })

  it('usa el grafo (guia estructural)', () => {
    expect(buildRepairPrompt('Nucleo', [])).toContain('GRAFO PRIMERO')
  })
})
