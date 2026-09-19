import type { WorkflowReplyOptions } from './opciones-de-respuesta'
import { planWorkflow } from '@domain/workflow/plan-workflow'
import { routeWorkflow } from '@domain/workflow/route-workflow'
import { buildWorkflowReport } from '@domain/workflow/workflow-report'
import { consolidate, participants } from '@domain/workflow/workflow-result'
import { runWorkflow } from '../workflow/run-workflow'
import { replyFromChat } from './reply-from-chat'
import { sumUsage } from './sum-usage'
import type { ReplyOutcome } from './reply-outcome'


/**
 * Un mensaje se enruta a un workflow y sus pasos se ejecutan en orden: lo que
 * ve el operador es el informe consolidado, no cinco respuestas sueltas.
 */
export async function replyFromWorkflow(options: WorkflowReplyOptions): Promise<ReplyOutcome> {
  const workflow = routeWorkflow(options.prompt)

  // Una pregunta libre no es un escaneo: se responde en conversacion.
  if (workflow.id === 'libre') return replyFromChat(options)

  const plan = planWorkflow(workflow, options.excludedAgents)

  const outcome = await runWorkflow(
    {
      codeAgent: options.codeAgent,
      project: options.project,
      corpus: options.corpus,
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
    edits: outcome.results.flatMap((result) => result.edits),
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
export type { WorkflowReplyOptions } from './opciones-de-respuesta'
