import type { CodeAgent } from '@domain/chat/code-agent'
import type { Project } from '@domain/project/project'
import { parseScanOutput } from '@domain/scan/parse-scan-output'
import type { OperationMode } from '@domain/settings/operation-mode'
import { permissionModeFor } from '@domain/settings/permission-mode'
import { buildStepPrompt } from '@domain/workflow/step-prompt'
import type { StepResult, WorkflowOutcome } from '@domain/workflow/workflow-result'
import type { WorkflowPlan } from '@domain/workflow/plan-workflow'
import { totalTokens } from '@domain/telemetry/token-usage'
import { runStep } from './run-step'
import type { StepProgress } from './step-progress'

export interface WorkflowDeps {
  readonly codeAgent: CodeAgent
  readonly project: Project
  readonly mode: OperationMode
  readonly onStep: (progress: StepProgress) => void
  readonly onChunk: (delta: string) => void
  readonly known: readonly string[]
  readonly isCancelled: () => boolean
}

/** Resumen de un paso para el siguiente: evita que se repitan hallazgos. */
function summarize(result: StepResult): readonly string[] {
  return result.findings.map((finding) => `${finding.severity} ${finding.file}: ${finding.title}`)
}

/** Tokens y coste acumulados de los pasos ya terminados. */
function progressOf(results: readonly StepResult[]): { tokens: number; costUsd: number } {
  return {
    tokens: results.reduce((sum, r) => sum + totalTokens(r.usage), 0),
    costUsd: results.reduce((sum, r) => sum + r.usage.costUsd, 0)
  }
}

/**
 * Ejecuta los pasos en orden. Un paso con puerta que encuentre CRITICAL
 * detiene el workflow: seguir limpiando o editando encima de un agujero
 * abierto es trabajar sobre algo que hay que arreglar primero.
 */
export async function runWorkflow(
  deps: WorkflowDeps,
  plan: WorkflowPlan
): Promise<WorkflowOutcome> {
  const results: StepResult[] = []
  const previous: string[] = []
  const permissionMode = permissionModeFor(deps.mode)

  for (const [index, step] of plan.active.entries()) {
    // Se mira antes de arrancar cada paso: detener no puede significar
    // "termina los seis que quedan y luego para".
    if (deps.isCancelled()) return { results, stoppedBy: null }
    deps.onStep({ index, total: plan.active.length, ...progressOf(results) })

    const prompt = buildStepPrompt(step, {
      projectName: deps.project.name,
      previous,
      known: deps.known,
      mode: deps.mode
    })

    const result = await runStep(deps, step.agentId, prompt, permissionMode, parseScanOutput)
    results.push(result)
    previous.push(...summarize(result))

    const bloquea = step.gate === true && result.findings.some((f) => f.severity === 'CRITICAL')
    if (bloquea) return { results, stoppedBy: step.agentId }
  }

  // Cierre: el ultimo agente terminado tambien cuenta. Sin esto el medidor
  // quedaba con el total de todos MENOS el ultimo paso.
  const n = plan.active.length
  deps.onStep({ index: n, total: n, ...progressOf(results) })
  return { results, stoppedBy: null }
}
