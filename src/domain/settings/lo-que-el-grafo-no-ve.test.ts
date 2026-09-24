import { describe, expect, it } from 'vitest'
import { CON_BASH } from '../agent/capacidades-fixture'
import { buildChatPrompt } from '../chat/chat-prompt'
import { EMPTY_CORPUS } from '../project/corpus-descriptor'
import { buildAnalysisPrompt } from '../repair/analysis-prompt'
import { EL_GRAFO } from '../repair/analysis-prompt-grafo'
import { buildScanPrompt } from '../scan/scan-prompt'
import { GRAPH_FIRST, GRAPH_FIRST_SECURITY, GRAPH_FIRST_STRUCTURAL } from './graph-first'
import { LO_QUE_EL_GRAFO_NO_VE } from './lo-que-el-grafo-no-ve'

// prettier-ignore
const TARGET = { id: 'f1', severity: 'LOW' as const, title: 't', file: 'src/a.ts', line: 1, firstSeen: '2026-01-01T00:00:00.000Z', tipo: null, simbolo: null }
const CHAT = { projectName: 'P', corpus: EMPTY_CORPUS, known: [], mode: 'supervisado' as const }

describe('lo que el grafo no ve, dicho en los tres bloques grafo primero (ADR-104 §2)', () => {
  it('nombra las TRES superficies medidas y el camino: Read y Grep', () => {
    for (const s of ['.claude/', '.fortress/', '.husky/', '.gitignore', 'politicas SQL', 'GRANT', 'buckets', 'Read y Grep']) expect(LO_QUE_EL_GRAFO_NO_VE).toContain(s) // prettier-ignore
  })

  it('no afirma una cuarta que no se midio: los handlers inline van a DEUDAS, no al prompt', () => {
    expect(LO_QUE_EL_GRAFO_NO_VE).not.toMatch(/handler|serve\(|createServer/)
  })

  it('las tres variantes de GRAPH_FIRST la llevan', () => {
    for (const v of [GRAPH_FIRST, GRAPH_FIRST_SECURITY, GRAPH_FIRST_STRUCTURAL]) expect(v).toContain(LO_QUE_EL_GRAFO_NO_VE) // prettier-ignore
  })

  it('el bloque del analista (EL_GRAFO) la lleva', () => {
    expect(EL_GRAFO.join('\n')).toContain(LO_QUE_EL_GRAFO_NO_VE)
  })

  it('llega a los tres prompts reales: escaner, analista y chat', () => {
    expect(buildScanPrompt('P', EMPTY_CORPUS, ['src'])).toContain(LO_QUE_EL_GRAFO_NO_VE)
    expect(buildAnalysisPrompt(TARGET, EMPTY_CORPUS, [], 'g', CON_BASH)).toContain(LO_QUE_EL_GRAFO_NO_VE) // prettier-ignore
    expect(buildChatPrompt('x', CHAT)).toContain(LO_QUE_EL_GRAFO_NO_VE)
  })
})
