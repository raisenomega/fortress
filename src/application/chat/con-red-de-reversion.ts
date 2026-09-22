import { avisoSinVerificar } from '@domain/chat/aviso-sin-verificar'
import { CHECKPOINT_HUERFANO, REVERTIDO_POR_RED, SIN_RED_NO_SE_EDITA, type RedDeReversion } from '@domain/chat/red-de-reversion' // prettier-ignore
import { SIN_JUZGAR } from '@domain/chat/veredicto-del-turno'
import { arbitrar, seDescarta, type Arbitro } from './desenlace-del-turno'
import { textOnly, type ReplyOutcome } from './reply-outcome'
import type { TurnoProtegido } from './turno-protegido'

export type { TurnoProtegido }

/** Sin checkpoint no hay nada que arbitrar: el turno pasa tal cual, sin aviso ni juicio. */
// prettier-ignore
const talCual = (outcome: ReplyOutcome): TurnoProtegido =>
  ({ outcome, aviso: '', conservado: false, revertido: false, veredicto: SIN_JUZGAR, arbol: 'verde' })

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
  // Se pidio red y no se pudo montar: NO se produce (ADR-079). `disponible`
  // adelanta la causa conocida (identidad); esto tapa las que no puede prever:
  // indice bloqueado, permisos, disco. Si debia haber red y no la hay, no se escribe.
  if (activa && cp === null) return talCual({ ...textOnly(SIN_RED_NO_SE_EDITA), failed: true })

  let outcome: ReplyOutcome
  try {
    outcome = await producir()
  } catch (error) {
    cp?.revertir()
    throw error
  }
  if (cp === null) return talCual(outcome)

  // ADR-090: con juez, OMEGA mira lo editado ANTES de conservar; sin juez manda el gate.
  const arbitraje = await arbitrar(red, cwd, cp, outcome, juez)
  const descartar = seDescarta(arbitraje)
  const retirado = descartar ? cp.revertir() : cp.conservar()
  return {
    outcome,
    // ADR-091: lo que se conserva sin haberse compilado NO se queda mudo, y dice POR QUE.
    aviso:
      (arbitraje.rojo ? REVERTIDO_POR_RED : '') +
      (!descartar && arbitraje.arbol === 'desconocida' ? avisoSinVerificar(arbitraje.motivo) : '') +
      (retirado ? '' : CHECKPOINT_HUERFANO),
    conservado: !descartar,
    revertido: descartar,
    veredicto: arbitraje.veredicto,
    arbol: arbitraje.arbol
  }
}
