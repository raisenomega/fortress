/** Lo que dejo UN comando del gate (npm ci incluido, como setup). */
export interface CommandOutcome {
  readonly command: string
  readonly exitCode: number
  readonly durationMs: number
  readonly stdoutTail: string
  readonly stderrTail: string
  readonly timedOut: boolean
}

export type GateFailureReason =
  | 'gate_failed'
  | 'gate_timeout'
  | 'npm_ci_failed'
  /** El proyecto no tiene NINGUN script con el que verificar el fix. */
  | 'gate_sin_verificacion'

/**
 * El juicio completo: o todo verde, o donde y por que se rompio la cadena.
 *
 * `skipped` son las intenciones que el proyecto no sabe cumplir —no tiene
 * script para ellas— y que por tanto NO se verificaron. Va aparte de `ok` a
 * proposito: verde con algo saltado no es verde entero, y quien lea el
 * desenlace tiene derecho a saber que se comprobo y que no. Ausente significa
 * que no consta, no que no hubiera nada.
 */
export type GateOutcome =
  | {
      readonly ok: true
      readonly commands: readonly CommandOutcome[]
      readonly skipped?: readonly string[]
      /** Reservado a (ii-b): hoy un verde no puede traer nada heredado. */
      readonly heredado?: readonly string[]
    }
  | {
      readonly ok: false
      readonly commands: readonly CommandOutcome[]
      readonly failedAt: string
      readonly reason: GateFailureReason
      readonly skipped?: readonly string[]
      /**
       * Comandos que fallaron y YA fallaban sobre la base, sin que el fix
       * anadiera nada suyo. No cambia el veredicto —rojo es rojo— pero cambia
       * de quien es: heredarlo no es haberlo roto. Son TODOS los heredados que
       * se encontraron, no solo el primero: la cadena ya no se para en ellos.
       */
      readonly heredado?: readonly string[]
    }

export function gatePassed(outcome: GateOutcome): outcome is Extract<GateOutcome, { ok: true }> {
  return outcome.ok
}
