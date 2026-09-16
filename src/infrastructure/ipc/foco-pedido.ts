import type { SendMessageInput } from '@application/chat/send-message-types'
import { idsPedidos } from './ids-pedidos'

/**
 * El `findingId` que llega del renderer, saneado: una cadena no vacia, o nada.
 * Es el molde de `ids-pedidos`: el renderer no es fuente de confianza, asi que
 * aqui solo se limpia la FORMA; que el hallazgo exista, sea de ese proyecto y
 * siga vivo lo decide `leerFoco` contra la base.
 */
export function focoPedido(crudo: unknown): string | undefined {
  if (typeof crudo !== 'string') return undefined
  const id = crudo.trim()
  return id === '' ? undefined : id
}

/** El envio con su foco y su lote saneados. Del lote solo se limpia la FORMA
 *  (molde de `idsPedidos`); que cada id exista, sea de este proyecto y siga vivo
 *  lo decide la base, igual que el foco. Sin ninguno, el turno sale como siempre. */
export function conFocoSaneado(input: SendMessageInput): SendMessageInput {
  // El lote crudo se SACA del envio y solo vuelve ya limpio: dejarlo pasar con
  // un spread devolvia tal cual lo que no fuera una lista.
  const { lote, ...resto } = input
  const limpio = idsPedidos(lote)
  // Sin lote la llave ni aparece: un envio de siempre sale exactamente igual.
  const foco = focoPedido(input.findingId)
  return { ...resto, findingId: foco, ...(limpio.length > 0 ? { lote: limpio } : {}) }
}
