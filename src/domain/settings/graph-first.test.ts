import { describe, expect, it } from 'vitest'
import { agentPrompt } from '../agent/agent-prompt'
import { SENTINEL_OMEGA } from '../agent/sentinel-omega'
import { buildChatPrompt } from '../chat/chat-prompt'
import { buildScanPrompt } from '../scan/scan-prompt'
import { buildStepPrompt } from '../workflow/step-prompt'
import { GRAPH_FIRST } from './graph-first'

const HUELLA = 'GRAFO PRIMERO'

describe('GRAFO PRIMERO en todos los prompts (no negociable)', () => {
  it('el escaneo obliga a usar el grafo', () => {
    expect(buildScanPrompt('X')).toContain(HUELLA)
  })

  it('el chat obliga a usar el grafo', () => {
    const prompt = buildChatPrompt('hola', { projectName: 'X', known: [], mode: 'supervisado' })
    expect(prompt).toContain(HUELLA)
  })

  it('cada paso de workflow obliga a usar el grafo', () => {
    const prompt = buildStepPrompt(
      { agentId: 'code-reviewer', task: 'revisa' },
      { projectName: 'X', previous: [], known: [], mode: 'supervisado' }
    )
    expect(prompt).toContain(HUELLA)
  })

  it('OMEGA tambien: su carta lo incluye', () => {
    expect(agentPrompt(SENTINEL_OMEGA)).toContain('codebase-memory')
  })

  it('la instruccion nombra las herramientas reales del grafo', () => {
    expect(GRAPH_FIRST).toContain('index_repository')
    expect(GRAPH_FIRST).toContain('search_graph')
  })
})
