/**
 * Valores de arranque, medidos sobre un proyecto minusculo de tres archivos.
 * Se quedan MUY cortos en un repositorio real: el mismo escaneo sobre este
 * proyecto costo unos $1 y no $0.07. Por eso solo se usan cuando todavia no
 * hay historial propio del que tirar.
 */
const SECONDS_PER_STEP = 50
const USD_PER_STEP = 0.07

/** Lo que este proyecto ha costado de verdad, por ejecucion. */
export interface MeasuredRun {
  readonly seconds: number
  readonly usd: number
}

export interface WorkflowEstimate {
  readonly steps: number
  readonly seconds: number
  readonly usd: number
  /** Falso si no hay historial y se esta usando el valor de arranque. */
  readonly measured: boolean
}

/**
 * Estimacion a partir de lo que este proyecto ya costo. Un repositorio grande
 * cuesta quince veces mas que uno pequeno, asi que una constante global
 * enganaria justo donde mas importa: antes de lanzar siete agentes.
 */
export function estimateWorkflow(
  activeSteps: number,
  measured: MeasuredRun | null = null
): WorkflowEstimate {
  const seconds = measured?.seconds ?? SECONDS_PER_STEP
  const usd = measured?.usd ?? USD_PER_STEP

  return {
    steps: activeSteps,
    seconds: Math.round(activeSteps * seconds),
    usd: activeSteps * usd,
    measured: measured !== null
  }
}

/** "unos 6 min" / "unos 50 s": redondeado, porque es una estimacion. */
export function describeDuration(seconds: number): string {
  if (seconds < 90) return `unos ${seconds} s`
  return `unos ${Math.round(seconds / 60)} min`
}
