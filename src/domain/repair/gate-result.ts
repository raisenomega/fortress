/** Lo que dejo UN comando del gate (npm ci incluido, como setup). */
export interface CommandOutcome {
  readonly command: string
  readonly exitCode: number
  readonly durationMs: number
  readonly stdoutTail: string
  readonly stderrTail: string
  readonly timedOut: boolean
}

export type GateFailureReason = 'gate_failed' | 'gate_timeout' | 'npm_ci_failed'

/** El juicio completo: o todo verde, o donde y por que se rompio la cadena. */
export type GateOutcome =
  | { readonly ok: true; readonly commands: readonly CommandOutcome[] }
  | {
      readonly ok: false
      readonly commands: readonly CommandOutcome[]
      readonly failedAt: string
      readonly reason: GateFailureReason
    }

export function gatePassed(outcome: GateOutcome): outcome is Extract<GateOutcome, { ok: true }> {
  return outcome.ok
}
