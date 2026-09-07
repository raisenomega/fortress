import { describe, expect, it } from 'vitest'
import type { CodeAgent, CodeAgentReply } from '@domain/chat/code-agent'
import { EMPTY_CORPUS } from '@domain/project/corpus-descriptor'
import type { Project } from '@domain/project/project'
import { EMPTY_USAGE } from '@domain/telemetry/token-usage'
import { replyFromWorkflow } from '../chat/reply-from-workflow'

/** Cada paso escribe un fichero distinto: asi se ve si el consolidado los junta o los tira. */
function cliQueEdita(porPaso: readonly string[][]): CodeAgent {
  let paso = 0
  return {
    isAvailable: () => true,
    precheck: () => null,
    run: (): Promise<CodeAgentReply> => {
      const edits = porPaso[paso] ?? []
      paso += 1
      return Promise.resolve({ text: '', failed: false, denials: [], usage: EMPTY_USAGE, tools: [], edits }) // prettier-ignore
    }
  }
}

describe('g) el workflow ya no tira los edits', () => {
  it('el consolidado lleva los ficheros que escribio CADA paso, en orden', async () => {
    // Antes `edits: []` a secas: la Actividad no registraba ni una edicion de un
    // workflow, y el operador no sabia que se toco salvo por `git status`.
    const outcome = await replyFromWorkflow({
      codeAgent: cliQueEdita([['x.ts'], ['y.ts', 'z.ts'], []]),
      project: { id: 'p1', name: 'P', path: '/tmp/p', trusted: true } as Project,
      corpus: EMPTY_CORPUS,
      // Una orden sin area protegida: dispara el workflow de limpieza (3 pasos + cierre).
      prompt: 'limpia el codigo muerto',
      mode: 'autonomo',
      excludedAgents: [],
      onStep: () => {},
      onChunk: () => {},
      known: [],
      isCancelled: () => false
    })

    expect(outcome.edits).toEqual(['x.ts', 'y.ts', 'z.ts'])
  })
})
