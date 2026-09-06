import { redactSecrets } from '@domain/chat/tool-detail'

/**
 * Lo que sale EN VIVO al chat, tachado antes de salir.
 *
 * Se envuelve UNA vez, en el paso por el que el callback baja a todos los
 * motores, y no dentro de cada uno: el CLI lo emite trozo a trozo desde su
 * acumulador y la API por su propio stream, y ninguno de los dos tiene que
 * enterarse de esto ni acordarse de hacerlo.
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
