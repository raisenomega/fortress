import { describe, expect, it } from 'vitest'
import { EMPTY_CORPUS } from '../project/corpus-descriptor'
import { agentPrompt } from '../agent/agent-prompt'
import { SENTINEL_OMEGA } from '../agent/sentinel-omega'
import { buildChatPrompt } from '../chat/chat-prompt'
import { buildScanPrompt } from '../scan/scan-prompt'
import { buildStepPrompt } from '../workflow/step-prompt'
import { GRAPH_FIRST, graphFirstFor } from './graph-first'

const HUELLA = 'GRAFO PRIMERO'

describe('GRAFO PRIMERO en todos los prompts (no negociable)', () => {
  it('el escaneo obliga a usar el grafo', () => {
    expect(buildScanPrompt('X', EMPTY_CORPUS)).toContain(HUELLA)
  })

  it('el chat obliga a usar el grafo', () => {
    const prompt = buildChatPrompt('hola', {
      projectName: 'X',
      corpus: EMPTY_CORPUS,
      known: [],
      mode: 'supervisado'
    })
    expect(prompt).toContain(HUELLA)
  })

  it('cada paso de workflow obliga a usar el grafo', () => {
    const prompt = buildStepPrompt(
      { agentId: 'code-reviewer', task: 'revisa' },
      { projectName: 'X', corpus: EMPTY_CORPUS, previous: [], known: [], mode: 'supervisado' }
    )
    expect(prompt).toContain(HUELLA)
  })

  it('OMEGA tambien: su carta lo incluye', () => {
    expect(agentPrompt(SENTINEL_OMEGA, EMPTY_CORPUS)).toContain('codebase-memory')
  })

  it('la instruccion nombra las herramientas reales del grafo', () => {
    expect(GRAPH_FIRST).toContain('index_repository')
    expect(GRAPH_FIRST).toContain('search_graph')
  })

  it('la guia se adapta al rol: seguridad localiza, estructural rastrea llamadas', () => {
    // Seguridad es cazar patrones (grep); el grafo solo SALTA al codigo sensible.
    expect(graphFirstFor('security-reviewer')).toContain('search_code')
    // Estructural es "quien llama / esta muerto": ahi trace_path reemplaza el grep.
    expect(graphFirstFor('refactor-cleaner')).toContain('trace_path')
    expect(graphFirstFor('cognition')).toBe(GRAPH_FIRST)
  })
})
