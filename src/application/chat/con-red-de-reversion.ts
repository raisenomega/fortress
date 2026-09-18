import { CHECKPOINT_HUERFANO, REVERTIDO_POR_RED, SIN_RED_NO_SE_EDITA, type RedDeReversion } from '@domain/chat/red-de-reversion' // prettier-ignore
import { CONSERVADO_SIN_VERIFICAR } from '@domain/chat/no-se-pudo-verificar'
import { SIN_JUZGAR } from '@domain/chat/veredicto-del-turno'
import { arbitrar, seDescarta, type Arbitro } from './desenlace-del-turno'
import { textOnly, type ReplyOutcome } from './reply-outcome'
import type { TurnoProtegido } from './turno-protegido'

export type { TurnoProtegido }

/**
 * Un turno del Terminal dentro de la red del ADR-079. La UNIDAD es el turno:
 * un checkpoint antes de producir la respuesta y una decision despues, por el
 * unico punto por el que pasan los dos caminos —workflow y conversacion—.
 *
 * `activa` la decide quien llama (autonomo y motor CLI: lo unico que edita);
 * con `abrir` en null se corre como siempre, sin red, y ese null es la senal
 * que el modo efectivo usa para degradar.
 *
 * Que se conserva y que se deshace lo decide `arbitrar`, que es donde vive
 * ahora el gate y, desde el ADR-090, el juicio de OMEGA delante de el.
 *
 * El `catch` es para excepciones de verdad (una base que no escribe, un bug):
 * revierte y deja pasar el error tal cual.
 */
export async function conRedDeReversion(
  red: RedDeReversion,
  cwd: string,
  activa: boolean,
  producir: () => Promise<ReplyOutcome>,
  /** Solo en autonomo. `null` deja el turno exactamente como estaba antes. */
  juez: Arbitro | null = null
): Promise<TurnoProtegido> {
  const cp = activa ? red.abrir(cwd) : null
  // Se pidio red y no se pudo montar: NO se produce. El turno iba a EDITAR y sin
  // checkpoint no habria vuelta — lo que ADR-079 existe para impedir. `disponible`
  // adelanta la causa conocida (identidad); esto tapa las que no puede prever:
  // indice bloqueado, permisos, disco. Si debia haber red y no la hay, no se escribe.
  if (activa && cp === null) {
    const outcome = { ...textOnly(SIN_RED_NO_SE_EDITA), failed: true }
    return { outcome, aviso: '', conservado: false, revertido: false, veredicto: SIN_JUZGAR, arbol: 'verde' } // prettier-ignore
  }

  let outcome: ReplyOutcome
  try {
    outcome = await producir()
  } catch (error) {
    cp?.revertir()
    throw error
  }
  if (cp === null) return { outcome, aviso: '', conservado: false, revertido: false, veredicto: SIN_JUZGAR, arbol: 'verde' } // prettier-ignore // prettier-ignore

  // ADR-090: el gate ya no decide solo. Con juez, OMEGA mira lo editado ANTES
  // de que se conserve; sin juez —supervisado— manda el gate, como siempre.
  const arbitraje = await arbitrar(red, cwd, cp, outcome, juez)
  const descartar = seDescarta(arbitraje)
  const retirado = descartar ? cp.revertir() : cp.conservar()
  return {
    outcome,
    // ADR-091: lo que se conserva sin haberse compilado NO se queda mudo.
    aviso:
      (arbitraje.rojo ? REVERTIDO_POR_RED : '') +
      (!descartar && arbitraje.arbol === 'desconocida' ? CONSERVADO_SIN_VERIFICAR : '') +
      (retirado ? '' : CHECKPOINT_HUERFANO),
    conservado: !descartar,
    revertido: descartar,
    veredicto: arbitraje.veredicto,
    arbol: arbitraje.arbol
  }
}
