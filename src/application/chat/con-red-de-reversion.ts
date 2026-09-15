import { CHECKPOINT_HUERFANO, REVERTIDO_POR_RED, type RedDeReversion } from '@domain/chat/red-de-reversion' // prettier-ignore
import type { ReplyOutcome } from './reply-outcome'

export interface TurnoProtegido {
  readonly outcome: ReplyOutcome
  /** Lo que se le anade al texto de la respuesta: vacio si no hubo que decir nada. */
  readonly aviso: string
  /** La red estaba puesta y el turno se quedo en el arbol. Sin red es false: nada
   *  garantiza lo que quedo, y el cierre del ciclo (ADR-088) solo se fia de esto. */
  readonly conservado: boolean
  /** La red estaba puesta y DESHIZO el turno. NO es lo contrario de `conservado`:
   *  sin red los dos son false —nadie conservo ni revirtio nada—, y la memoria
   *  por hallazgo (ADR-088, Enmienda 2) necesita distinguir ese caso. */
  readonly revertido: boolean
}

/**
 * Un turno del Terminal dentro de la red del ADR-079. La UNIDAD es el turno:
 * un checkpoint antes de producir la respuesta y una decision despues, por el
 * unico punto por el que pasan los dos caminos —workflow y conversacion—.
 *
 * `activa` la decide quien llama (autonomo y motor CLI: lo unico que edita);
 * con `abrir` en null se corre como siempre, sin red, y ese null es la senal
 * que el modo efectivo usa para degradar.
 *
 * Revierte: `outcome.failed` —que es tambien lo que deja Detener, porque el
 * hijo muerto resuelve con failed en vez de lanzar— y el typecheck en rojo.
 * NO revierte el paro por CRITICAL: viaja como `stoppedBy`, no como `failed`,
 * asi que no entra aqui sin que haya que distinguirlo.
 *
 * Solo se verifica si hubo ediciones: sin ellas no hay nada que compilar, y un
 * rojo heredado del proyecto no es culpa de un turno que no toco nada. Un fallo
 * sin ediciones si revierte —es un no-op sobre el arbol— porque lo que hubiera
 * quedado a medias no debe quedar.
 *
 * El `catch` es para excepciones de verdad (una base que no escribe, un bug):
 * revierte y deja pasar el error tal cual.
 */
export async function conRedDeReversion(
  red: RedDeReversion,
  cwd: string,
  activa: boolean,
  producir: () => Promise<ReplyOutcome>
): Promise<TurnoProtegido> {
  const cp = activa ? red.abrir(cwd) : null

  let outcome: ReplyOutcome
  try {
    outcome = await producir()
  } catch (error) {
    cp?.revertir()
    throw error
  }
  if (cp === null) return { outcome, aviso: '', conservado: false, revertido: false }

  const rojo = outcome.failed || (outcome.edits.length > 0 && !(await red.verificar(cwd)))
  const retirado = rojo ? cp.revertir() : cp.conservar()
  return {
    outcome,
    aviso: (rojo ? REVERTIDO_POR_RED : '') + (retirado ? '' : CHECKPOINT_HUERFANO),
    conservado: !rojo,
    revertido: rojo
  }
}
