/**
 * Lo que OMEGA dictamino sobre lo que el turno dejo escrito (ADR-090, Fase A).
 *
 * `juzgado: false` NO es un aprobado: es que no hubo juicio. Pasa en supervisado
 * —ahi el auditor es el humano—, cuando el turno no edito nada, y cuando el gate
 * ya lo tumbo. Distinguirlo del aprobado importa: conservar por no haber juzgado
 * y conservar por haber pasado el juicio son cosas distintas, y el ciclo de
 * convergencia solo reintenta sobre la segunda.
 */
export type VeredictoDelTurno =
  | { readonly juzgado: false }
  | { readonly juzgado: true; readonly aprobado: true }
  | {
      readonly juzgado: true
      readonly aprobado: false
      /** La razon de OMEGA. Va al productor como el mensaje siguiente. */
      readonly razon: string
      /** Huella de lo que se intento, para saber si el reintento AVANZA. Dos
       *  intentos con la misma huella son el mismo intento: ahi no se converge. */
      readonly huella: string
    }

export const SIN_JUZGAR: VeredictoDelTurno = { juzgado: false }

/** Conservar exige que nadie haya vetado. Sin juicio decide el gate, como siempre. */
export function vetado(v: VeredictoDelTurno): boolean {
  return v.juzgado && !v.aprobado
}
