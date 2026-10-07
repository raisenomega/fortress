import type { AgentId } from '@domain/agent/agent'
import type { DetectedFinding } from '@domain/scan/detected-finding'
import type { ClaudePermissionMode } from '@domain/settings/permission-mode'
import type { Result } from '@domain/shared/result'
import type { StepResult } from '@domain/workflow/workflow-result'
import type { WorkflowDeps } from './run-workflow'

type ParseReport = (output: string) => Result<readonly DetectedFinding[]>

/**
 * Un paso suelto. Que el informe no se pueda leer NO es lo mismo que no haber
 * encontrado nada: se marca reportRead en falso y el consolidado lo dice, en
 * vez de sumar un agente "limpio" que en realidad no contesto bien.
 */
export async function runStep(
  deps: WorkflowDeps,
  agentId: AgentId,
  prompt: string,
  permissionMode: ClaudePermissionMode,
  parse: ParseReport
): Promise<StepResult> {
  const startedAt = Date.now()
  const reply = await deps.codeAgent.run(
    {
      projectPath: deps.project.path,
      // Con dueño, o Detener no lo alcanza: el hijo se registra con este id y
      // `killChildrenOf` solo mata a los del proyecto que se para.
      projectId: deps.project.id,
      prompt,
      permissionMode,
      agentId,
      trusted: deps.project.trusted
    },
    deps.onChunk
  )

  const parsed = parse(reply.text)

  return {
    agentId,
    text: reply.text,
    findings: parsed.ok ? parsed.value : [],
    reportRead: parsed.ok,
    failed: reply.failed,
    usage: reply.usage,
    tools: reply.tools,
    edits: reply.edits,
    durationMs: Date.now() - startedAt,
    ...(reply.modelo === undefined ? {} : { modelo: reply.modelo })
  }
}
