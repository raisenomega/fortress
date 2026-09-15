import type { SendMessageInput } from '@application/chat/send-message-types'

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

/** El envio con su foco saneado. Sin foco, el turno sale como siempre. */
export function conFocoSaneado(input: SendMessageInput): SendMessageInput {
  return { ...input, findingId: focoPedido(input.findingId) }
}
