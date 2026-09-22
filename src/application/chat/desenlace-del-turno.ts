import { medida } from '@domain/chat/medida-del-arbol'
import type { MotivoSinVerificar } from '@domain/chat/no-se-pudo-verificar'
import type { CheckpointDelTurno, RedDeReversion } from '@domain/chat/red-de-reversion'
import { SIN_JUZGAR, vetado, type VeredictoDelTurno } from '@domain/chat/veredicto-del-turno'
import { cortaElTurno, type VerificacionDelArbol } from '@domain/chat/verificacion-del-arbol'
import type { HallazgoJuzgado } from '@domain/repair/hallazgo-juzgado'
import type { JuezDelTurno } from './juez-del-turno'
import type { ReplyOutcome } from './reply-outcome'
import { corresponde, type Tribunal } from './tribunal-del-turno'

/** Quien juzga y contra que plano. `null` = sin juicio (supervisado). */
export interface Arbitro {
  readonly juez: JuezDelTurno
  readonly plan: HallazgoJuzgado
  /** Los criticos que atacan el fix antes de que OMEGA lo juzgue (ADR-096).
   *  Ausente = Fase A: solo OMEGA, como antes de existir el debate. */
  readonly tribunal?: Tribunal
}

export interface Arbitraje {
  /** El arbol no vale: el agente fallo, lo detuvieron, o no compila. */
  readonly rojo: boolean
  readonly veredicto: VeredictoDelTurno
  /** Que dijo el gate, y POR QUE si fue `desconocida`: no se conserva mudo ni en generico. */
  readonly arbol: VerificacionDelArbol
  readonly motivo: MotivoSinVerificar | null
  /** Lo que el tribunal encontro. Vacio = no corrio, o no encontro nada: las
   *  dos se conservan igual, y la diferencia la cuenta el parte. */
  readonly objeciones: readonly string[]
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
  // `failed` corta SIN mirar el arbol: gastar un typecheck en un turno que ya
  // se sabe perdido es tiempo tirado, y el `||` de antes lo cortocircuitaba.
  const { arbol, motivo } = !outcome.failed && edito ? await red.verificar(cwd) : medida('verde')
  const rojo = outcome.failed || cortaElTurno(arbol)
  const sinJuicio = { rojo, arbol, motivo, veredicto: SIN_JUZGAR, objeciones: [] }
  if (rojo || !edito || juez === null) return sinJuicio

  // El tribunal va AQUI, detras de la guarda: lo que no se juzga tampoco se
  // critica, y esa garantia no hay que reescribirla — se hereda del `return` de
  // arriba. Un espia la fija en `supervisado-sin-juez.test.ts`.
  const objeciones = juez.tribunal && corresponde(arbol) ? await juez.tribunal(cp, juez.plan) : []
  return { rojo, arbol, motivo, objeciones, veredicto: await juez.juez(cp, juez.plan, objeciones) }
}

/** Se descarta el turno si el gate lo tumbo o si OMEGA lo veto. */
export const seDescarta = (a: Arbitraje): boolean => a.rojo || vetado(a.veredicto)
