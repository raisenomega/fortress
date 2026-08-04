import type { AppContext } from '@application/context'
import { sendMessage } from '@application/chat/send-message'
import type { SendMessageInput } from '@application/chat/send-message-types'
import { runScan } from '@application/scan/run-scan'
import { usesApiKey } from '@application/settings/read-auth-source'
import { readBudget } from '@application/settings/read-budget'
import { buildMcpConfig } from '@domain/connectors/mcp-config'
import type { OperationMode } from '@domain/settings/operation-mode'
import { err, ok, type Result } from '@domain/shared/result'
import { resolveAssistant } from '../ai/assistant-factory'
import { describeAssistantError } from '../ai/describe-error'
import { createClaudeCodeAgent } from '../claude-code/claude-code-agent'
import { endRun, isCancelled } from '../run-control'
import { guardRun } from '../run-guard'
import { createClaudeScanner } from '../scan/claude-scanner'

/** Escanea y devuelve el score, o err (que el standby clasifica). */
export async function loopScan(
  context: AppContext,
  projectId: string,
  onProgress: (delta: string) => void
): Promise<Result<number>> {
  const busy = guardRun(context, projectId)
  if (busy !== null) return err(busy)
  const budget = readBudget(context)
  const scanner = createClaudeScanner(createClaudeCodeAgent(context.apiKeys, budget, usesApiKey(context)))
  try {
    const summary = await runScan(context, scanner, projectId, onProgress)
    return summary.ok ? ok(summary.value.score) : err(summary.error)
  } catch (error) {
    return err(error instanceof Error ? error.message : 'Fallo inesperado al escanear')
  } finally {
    endRun(projectId)
  }
}

/** Lanza el workflow de produccion. Auditoria: mode supervisado (no edita);
 *  reparacion: autonomo (edita). El resultado va al chat del proyecto. */
export async function loopWork(
  context: AppContext,
  projectId: string,
  mode: OperationMode,
  onChunk: (delta: string) => void
): Promise<Result<void>> {
  const busy = guardRun(context, projectId)
  if (busy !== null) return err(busy)
  const budget = readBudget(context)
  const codeAgent = createClaudeCodeAgent(
    context.apiKeys,
    budget,
    usesApiKey(context),
    buildMcpConfig(context.connectors.list())
  )
  const assistant = resolveAssistant(context.apiKeys)
  const input: SendMessageInput = { projectId, prompt: 'listo para produccion', mode, excludedAgents: [] }
  try {
    const done = await sendMessage(
      context,
      assistant.ok ? assistant.value : null,
      codeAgent,
      input,
      onChunk,
      () => {},
      () => isCancelled(projectId)
    )
    return done.ok ? ok(undefined) : err(done.error)
  } catch (error) {
    return err(describeAssistantError(error))
  } finally {
    endRun(projectId)
  }
}
