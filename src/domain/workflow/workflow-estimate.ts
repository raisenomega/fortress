/**
 * Coste y duracion aproximados de un workflow. Las constantes salen de medir
 * escaneos reales de este proyecto con Claude Code (~50s y ~$0.07 por agente),
 * no de una tarifa teorica.
 *
 * Es una estimacion y se etiqueta como tal: un proyecto grande tarda mas y un
 * paso que no encuentra nada tarda menos. Sirve para que nadie lance un
 * workflow de siete agentes creyendo que es gratis e instantaneo.
 */
const SECONDS_PER_STEP = 50
const USD_PER_STEP = 0.07

export interface WorkflowEstimate {
  readonly steps: number
  readonly seconds: number
  readonly usd: number
}

export function estimateWorkflow(activeSteps: number): WorkflowEstimate {
  return {
    steps: activeSteps,
    seconds: activeSteps * SECONDS_PER_STEP,
    usd: activeSteps * USD_PER_STEP
  }
}

/** "unos 6 min" / "unos 50 s": redondeado, porque es una estimacion. */
export function describeDuration(seconds: number): string {
  if (seconds < 90) return `unos ${seconds} s`
  return `unos ${Math.round(seconds / 60)} min`
}
