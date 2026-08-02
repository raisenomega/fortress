import type { CodeAgent } from '@domain/chat/code-agent'
import type { Project } from '@domain/project/project'
import { parseScanOutput } from '@domain/scan/parse-scan-output'
import type { OperationMode } from '@domain/settings/operation-mode'
import { permissionModeFor } from '@domain/settings/permission-mode'
import { buildStepPrompt } from '@domain/workflow/step-prompt'
import type { StepResult, WorkflowOutcome } from '@domain/workflow/workflow-result'
import type { WorkflowPlan } from '@domain/workflow/plan-workflow'
import { runStep } from './run-step'

export interface WorkflowDeps {
  readonly codeAgent: CodeAgent
  readonly project: Project
  readonly mode: OperationMode
  /** Avisa del paso que arranca, para que la UI lo pinte en vivo. */
  readonly onStep: (index: number, total: number) => void
  readonly onChunk: (delta: string) => void
}

/** Resumen de un paso para el siguiente: evita que se repitan hallazgos. */
function summarize(result: StepResult): readonly string[] {
  return result.findings.map((finding) => `${finding.severity} ${finding.file}: ${finding.title}`)
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
    deps.onStep(index, plan.active.length)

    const prompt = buildStepPrompt(step, {
      projectName: deps.project.name,
      previous
    })

    const result = await runStep(deps, step.agentId, prompt, permissionMode, parseScanOutput)
    results.push(result)
    previous.push(...summarize(result))

    const bloquea = step.gate === true && result.findings.some((f) => f.severity === 'CRITICAL')
    if (bloquea) return { results, stoppedBy: step.agentId }
  }

  return { results, stoppedBy: null }
}
