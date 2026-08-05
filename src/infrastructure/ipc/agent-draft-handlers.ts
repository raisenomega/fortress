import { ipcMain } from 'electron'
import { mkdtempSync, rmSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import { getAgentDraft, setAgentDraft } from '@application/system/agent-draft-edit'
import { activateAgent, deactivateAgent } from '@application/system/agent-activation'
import { draftAgentAuto } from '@application/system/draft-agent-auto'
import { usesApiKey } from '@application/settings/read-auth-source'
import { readBudget } from '@application/settings/read-budget'
import type { AgentDraft } from '@domain/system/agent-draft'
import { err } from '@domain/shared/result'
import { createClaudeCodeAgent } from '../claude-code/claude-code-agent'
import { getAppContext } from '../persistence/app-context'
import { endRun } from '../run-control'
import { guardRun } from '../run-guard'
import { IPC } from './channels'

/** IPC de las definiciones de agente auto-propuestas (borrador + activacion). */
export function registerAgentDraftHandlers(): void {
  ipcMain.handle(IPC.systemAgentDraft, (_event, id: string) => getAgentDraft(getAppContext(), id))

  ipcMain.handle(IPC.systemSetAgentDraft, (_event, id: string, draft: AgentDraft) =>
    setAgentDraft(getAppContext(), id, draft)
  )

  ipcMain.handle(IPC.systemActivateAgent, (_event, id: string, humanApproved: boolean) =>
    activateAgent(getAppContext(), id, humanApproved)
  )

  ipcMain.handle(IPC.systemDeactivateAgent, (_event, id: string) =>
    deactivateAgent(getAppContext(), id)
  )

  // Autonomia acotada: un agente redacta el borrador en un sandbox temporal
  // (nunca el repo de FORTRESS). Un disparo, con guarda de coste/concurrencia.
  ipcMain.handle(IPC.systemDraftAgentAuto, async (_event, id: string) => {
    const context = getAppContext()
    const busy = guardRun(context, id)
    if (busy !== null) return err(busy)
    const sandbox = mkdtempSync(join(tmpdir(), 'fortress-draft-'))
    try {
      const agent = createClaudeCodeAgent(context.apiKeys, readBudget(context), usesApiKey(context))
      return await draftAgentAuto(context, id, agent, sandbox)
    } finally {
      rmSync(sandbox, { recursive: true, force: true })
      endRun(id)
    }
  })
}
