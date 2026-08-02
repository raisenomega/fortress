import { addUsage, EMPTY_USAGE, type TokenUsage } from '@domain/telemetry/token-usage'
import type { StepResult } from '@domain/workflow/workflow-result'

/** Suma el consumo de todos los pasos de un workflow en un solo total. */
export function sumUsage(results: readonly StepResult[]): TokenUsage {
  return results.reduce((total, result) => addUsage(total, result.usage), EMPTY_USAGE)
}
