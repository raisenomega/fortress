import type { CheckpointDelTurno, RedDeReversion } from '@domain/chat/red-de-reversion'
import { SIN_JUZGAR, vetado, type VeredictoDelTurno } from '@domain/chat/veredicto-del-turno'
import type { HallazgoJuzgado } from '@domain/repair/hallazgo-juzgado'
import type { JuezDelTurno } from './juez-del-turno'
import type { ReplyOutcome } from './reply-outcome'

/** Quien juzga y contra que plano. `null` = sin juicio (supervisado). */
export interface Arbitro {
  readonly juez: JuezDelTurno
  readonly plan: HallazgoJuzgado
}

export interface Arbitraje {
  /** El arbol no vale: el agente fallo, lo detuvieron, o no compila. */
  readonly rojo: boolean
  readonly veredicto: VeredictoDelTurno
}

/**
 * Que hacer con lo que el turno dejo escrito, en el ORDEN que fija el ADR-090:
 * primero el gate, y solo si esta verde, el juicio de OMEGA.
 *
 * El orden no es una optimizacion: pedirle a OMEGA que juzgue un arbol que no
 * compila es pedirle que opine sobre algo roto, y gastaria una corrida para
 * decir lo que el gate ya dijo. Y sin ediciones no hay nada que juzgar.
 *
 * Rojo es `outcome.failed` —que es tambien lo que deja Detener, porque el hijo
 * muerto resuelve con failed en vez de lanzar— y el typecheck en rojo. NO el
 * paro por CRITICAL: viaja como `stoppedBy`, no como `failed`. Solo se verifica
 * si hubo ediciones: sin ellas no hay nada que compilar, y un rojo heredado del
 * proyecto no es culpa de un turno que no toco nada. Un fallo sin ediciones si
 * descarta —es un no-op— porque lo que quedara a medias no debe quedar.
 *
 * Solo juzga si hay JUEZ. En supervisado no lo hay —el auditor es el humano— y
 * entonces esto se comporta exactamente como antes de existir la pieza.
 */
export async function arbitrar(
  red: RedDeReversion,
  cwd: string,
  cp: CheckpointDelTurno,
  outcome: ReplyOutcome,
  juez: Arbitro | null
): Promise<Arbitraje> {
  const edito = outcome.edits.length > 0
  const rojo = outcome.failed || (edito && !(await red.verificar(cwd)))
  if (rojo || !edito || juez === null) return { rojo, veredicto: SIN_JUZGAR }
  return { rojo, veredicto: await juez.juez(cp, juez.plan) }
}

/** Se descarta el turno si el gate lo tumbo o si OMEGA lo veto. */
export const seDescarta = (a: Arbitraje): boolean => a.rojo || vetado(a.veredicto)
