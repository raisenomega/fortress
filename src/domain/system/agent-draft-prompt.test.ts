import { describe, expect, it } from 'vitest'
import { buildDraftPrompt, parseAgentDraft } from './agent-draft-prompt'

describe('buildDraftPrompt', () => {
  it('nombra la capacidad y pide el bloque parseable', () => {
    const prompt = buildDraftPrompt('Redactor', 'faltaba resumir')
    expect(prompt).toContain('Redactor')
    expect(prompt).toContain('AGENT-DRAFT:')
  })
})

describe('parseAgentDraft', () => {
  it('extrae name y prompt del bloque', () => {
    const parsed = parseAgentDraft('bla\nAGENT-DRAFT: {"name":"R","prompt":"analiza"}')
    expect(parsed).toEqual({ name: 'R', prompt: 'analiza' })
  })

  it('sin bloque devuelve null', () => {
    expect(parseAgentDraft('un texto cualquiera')).toBeNull()
  })

  it('un bloque roto no lanza', () => {
    expect(parseAgentDraft('AGENT-DRAFT: {roto')).toBeNull()
  })

  it('un item sin prompt se descarta', () => {
    expect(parseAgentDraft('AGENT-DRAFT: {"name":"R"}')).toBeNull()
  })
})
