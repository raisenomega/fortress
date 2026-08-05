import type { StepProgress } from '../workflow/step-progress'
import type { CodeAgent } from '@domain/chat/code-agent'
import type { Project } from '@domain/project/project'
import type { OperationMode } from '@domain/settings/operation-mode'
import type { AgentId } from '@domain/agent/agent'
import { planWorkflow } from '@domain/workflow/plan-workflow'
import { routeWorkflow } from '@domain/workflow/route-workflow'
import { buildWorkflowReport } from '@domain/workflow/workflow-report'
import { consolidate, participants } from '@domain/workflow/workflow-result'
import { runWorkflow } from '../workflow/run-workflow'
import { replyFromChat } from './reply-from-chat'
import { sumUsage } from './sum-usage'
import type { ReplyOutcome } from './reply-outcome'

export interface WorkflowReplyOptions {
  readonly codeAgent: CodeAgent
  readonly project: Project
  readonly prompt: string
  readonly mode: OperationMode
  readonly excludedAgents: readonly AgentId[]
  readonly onStep: (progress: StepProgress) => void
  readonly onChunk: (delta: string) => void
  readonly known: readonly string[]
  readonly isCancelled: () => boolean
}

/**
 * Un mensaje ya no lo atiende un agente suelto: se enruta a un workflow y se
 * ejecutan sus pasos en orden. El texto que ve el operador es el informe
 * consolidado, no la suma de cinco respuestas sueltas.
 */
export async function replyFromWorkflow(options: WorkflowReplyOptions): Promise<ReplyOutcome> {
  const workflow = routeWorkflow(options.prompt)

  // Una pregunta libre no es un escaneo: se responde en conversacion, no con
  // un informe de hallazgos vacio que descarta lo que el agente contesto.
  if (workflow.id === 'libre') return replyFromChat(options)

  const plan = planWorkflow(workflow, options.excludedAgents)

  const outcome = await runWorkflow(
    {
      codeAgent: options.codeAgent,
      project: options.project,
      mode: options.mode,
      onStep: options.onStep,
      onChunk: options.onChunk,
      known: options.known,
      isCancelled: options.isCancelled
    },
    plan
  )

  const aviso = plan.warnings.length === 0 ? '' : `\n\n> ${plan.warnings.join('\n> ')}`

  return {
    text: buildWorkflowReport(workflow, outcome) + aviso,
    failed: outcome.results.some((result) => result.failed),
    usage: sumUsage(outcome.results),
    tools: [],
    edits: [],
    agents: participants(outcome.results),
    comprehensive: workflow.id === 'produccion',
    runs: outcome.results.map((r) => ({
      agentId: r.agentId,
      usage: r.usage,
      failed: r.failed,
      durationMs: r.durationMs,
      tools: r.tools
    })),
    findings: consolidate(outcome.results)
  }
}
