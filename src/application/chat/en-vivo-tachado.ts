import { redactSecrets } from '@domain/chat/tool-detail'

/**
 * Lo que sale EN VIVO a la pantalla, tachado antes de salir.
 *
 * Nacio para el chat y hoy lo usan los CINCO canales en vivo: el chat, el
 * escaneo, el grafo, el bucle y la salida del login. Cada uno tiene su propio
 * emisor —por eso el tachado del chat no llegaba a los otros cuatro— y cada uno
 * se envuelve en su puerta, sin que quien emite tenga que acordarse.
 *
 * Por TROZO es lo unico que se puede hacer en vivo, y por eso NO basta: un
 * secreto partido entre dos trozos no encaja con ningun patron hasta que se
 * juntan, asi que se pinta. Ese limite no se puede cerrar sin retener la salida
 * —y entonces deja de ser en vivo—, de modo que lo que se GUARDA se tacha
 * aparte y entero, en `finishTurn`. Uno protege la pantalla; el otro, lo que
 * queda escrito para siempre.
 */
export function sinSecretosEnVivo(onChunk: (delta: string) => void): (delta: string) => void {
  return (delta) => onChunk(redactSecrets(delta))
}
