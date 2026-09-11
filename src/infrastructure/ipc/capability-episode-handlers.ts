import { ipcMain } from 'electron'
import { mkdtempSync, rmSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import { runLearningEpisode } from '@application/system/run-learning-episode'
import { usesApiKey } from '@application/settings/read-auth-source'
import { readBudget } from '@application/settings/read-budget'
import { GRAPH_REQUIRED_MSG } from '@domain/graph/require-graph'
import { err } from '@domain/shared/result'
import { agenteQueAsientaCorrida } from '../claude-code/agente-que-asienta'
import { createClaudeCodeAgent } from '../claude-code/claude-code-agent'
import { selfGraphMissing } from '../graph/self-graph'
import { getAppContext } from '../persistence/app-context'
import { endRun } from '../run-control'
import { guardRun } from '../run-guard'
import { IPC } from './channels'

/** IPC del episodio de aprendizaje: una corrida ACOTADA en un sandbox temporal. */
export function registerCapabilityEpisodeHandlers(): void {
  ipcMain.handle(IPC.systemRunEpisode, async (_event, id: string) => {
    const context = getAppContext()
    if (selfGraphMissing(context)) return err(GRAPH_REQUIRED_MSG)
    const busy = guardRun(context, id)
    if (busy !== null) return err(busy)
    // Se DECLARA fuera porque el finally lo borra, pero se CREA dentro: crear el
    // temporal puede fallar —disco lleno, permisos— y fuera del try ese fallo
    // saltaba por encima del `endRun` y dejaba el carril tomado para siempre.
    let sandbox: string | null = null
    try {
      sandbox = mkdtempSync(join(tmpdir(), 'fortress-episode-'))
      const agent = agenteQueAsientaCorrida(
        createClaudeCodeAgent(context.apiKeys, readBudget(context), usesApiKey(context)),
        context,
        'sistema'
      )
      return await runLearningEpisode(context, id, agent, sandbox)
    } finally {
      if (sandbox !== null) rmSync(sandbox, { recursive: true, force: true })
      endRun(id)
    }
  })
}
