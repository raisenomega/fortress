/** Lo que dejo UN comando del gate (npm ci incluido, como setup). */
export interface CommandOutcome {
  readonly command: string
  readonly exitCode: number
  readonly durationMs: number
  readonly stdoutTail: string
  readonly stderrTail: string
  readonly timedOut: boolean
  /** ADR-115 A1: las lineas de error de eslint/tsc/vitest, recogidas en vuelo
   *  (la cola sola las pierde). Opcional: las autopsias viejas no la traen. */
  readonly errores?: readonly string[]
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
      /**
       * Comandos que fallaron y YA fallaban sobre la base, sin que el fix
       * anadiera nada suyo. **Un verde SI puede traerlos**, y es la via normal:
       * `correrComandos` no corta en un rojo heredado y, si TODO lo que fallo
       * era heredado, devuelve `ok: true` con la lista.
       *
       * El docblock decia «hoy un verde no puede traer nada heredado». Era
       * FALSO, y describia un diseno anterior al que corre: medido el
       * 2026-09-30, habia pasado DOCE veces sobre FORTRESS —los doce
       * `test:unit`— y ocho de esos fixes llegaron a MERGEADO (DEUDAS §11.6).
       *
       * Quien lea un verde con esto DENTRO no esta leyendo un verde limpio:
       * `avisoDeHerencia` pone la diferencia en palabras, y viaja a OMEGA, a la
       * linea que el operador firma y al parte del drenaje.
       */
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
       * anadiera nada suyo. Son TODOS los heredados que se encontraron, no solo
       * el primero: la cadena no se para en ellos.
       *
       * El docblock decia «No cambia el veredicto —rojo es rojo—», y eso
       * CONTRADECIA al codigo: en `correrComandos`, si todo lo que fallo era
       * heredado el veredicto pasa a VERDE. Aqui, en la rama roja, lo heredado
       * conviene igual —dice de quien es cada rojo— pero el que decide el
       * veredicto es el conjunto: queda rojo porque algo NO heredado fallo.
       */
      readonly heredado?: readonly string[]
    }

export function gatePassed(outcome: GateOutcome): outcome is Extract<GateOutcome, { ok: true }> {
  return outcome.ok
}
