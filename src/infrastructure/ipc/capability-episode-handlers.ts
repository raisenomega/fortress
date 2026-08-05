import { ipcMain } from 'electron'
import { mkdtempSync, rmSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import { runLearningEpisode } from '@application/system/run-learning-episode'
import { usesApiKey } from '@application/settings/read-auth-source'
import { readBudget } from '@application/settings/read-budget'
import { err } from '@domain/shared/result'
import { createClaudeCodeAgent } from '../claude-code/claude-code-agent'
import { getAppContext } from '../persistence/app-context'
import { endRun } from '../run-control'
import { guardRun } from '../run-guard'
import { IPC } from './channels'

/** IPC del episodio de aprendizaje: una corrida ACOTADA en un sandbox temporal. */
export function registerCapabilityEpisodeHandlers(): void {
  ipcMain.handle(IPC.systemRunEpisode, async (_event, id: string) => {
    const context = getAppContext()
    const busy = guardRun(context, id)
    if (busy !== null) return err(busy)
    const sandbox = mkdtempSync(join(tmpdir(), 'fortress-episode-'))
    try {
      const agent = createClaudeCodeAgent(context.apiKeys, readBudget(context), usesApiKey(context))
      return await runLearningEpisode(context, id, agent, sandbox)
    } finally {
      rmSync(sandbox, { recursive: true, force: true })
      endRun(id)
    }
  })
}
