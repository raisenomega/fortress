import { describe, expect, it } from 'vitest'
import { EMPTY_CORPUS } from '../project/corpus-descriptor'
import { agentPrompt } from '../agent/agent-prompt'
import { SENTINEL_OMEGA } from '../agent/sentinel-omega'
import { buildChatPrompt } from '../chat/chat-prompt'
import { buildScanPrompt } from '../scan/scan-prompt'
import { buildStepPrompt } from '../workflow/step-prompt'
import {
  GRAPH_FIRST,
  GRAPH_FIRST_SECURITY,
  GRAPH_FIRST_STRUCTURAL,
  graphFirstFor
} from './graph-first'

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
    // Al reves que antes: la doctrina PROHIBE indexar. Se le pedia lo contrario y
    // el agente obedecia sobre el worktree o el sandbox donde estuviera.
    expect(GRAPH_FIRST).not.toContain('index_repository')
    expect(GRAPH_FIRST).toContain('NO lo indexes tu')
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

describe('la doctrina no manda indexar a nadie', () => {
  it('ninguna variante lo pide, y todas lo prohiben', () => {
    // `index-graph` afirma ser "la unica corrida donde el grafo ESCRIBE". Lo era
    // en su fichero y no en la practica: la doctrina mandaba indexar a todo
    // agente, y el que corria en un worktree o un sandbox indexaba ESA copia.
    for (const guia of [GRAPH_FIRST, GRAPH_FIRST_SECURITY, GRAPH_FIRST_STRUCTURAL]) {
      expect(guia).not.toContain('index_repository')
    }
    for (const id of ['security-reviewer', 'code-reviewer', 'cognition'] as const) {
      expect(graphFirstFor(id)).toContain('NO lo indexes tu')
    }
  })
})
