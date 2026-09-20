import type { FaseDelTurno } from '@domain/chat/fase-del-turno'

/**
 * El tono de cada fase. Nunca un color a mano: token del tema (CLAUDE.md).
 *
 * `Record` y no un ternario: una fase nueva no compila hasta que alguien decide
 * como se ve. Es lo que obligo a elegir el azul del juicio en vez de dejarlo
 * heredando el color de al lado sin que nadie lo notara.
 */
// El azul es «OMEGA esta pensando», y por eso el plan lo comparte con el juicio:
// es la misma cabeza haciendo lo mismo, en dos momentos. Lo que los separa es la
// etiqueta —un plan no es un diff—, no el color.
export const TONO: Record<FaseDelTurno, string> = {
  debate: 'text-high',
  juicio: 'text-proceso',
  plan: 'text-proceso'
}
