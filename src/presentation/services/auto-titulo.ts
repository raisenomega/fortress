import type { HiloDeChat } from '@domain/chat/hilo-de-chat'
import { elPuerto } from './puerto-de-hilos'

/** El CENTINELA: el titulo de cuna de los hilos eager (Revision A). */
export const CENTINELA = 'Nuevo chat'

/** Primeras ~40 letras del texto; vacio cae al centinela. */
export const tituloDe = (texto: string): string => texto.trim().slice(0, 40) || CENTINELA

/**
 * Auto-titulo (Revision B, PASO 121): al PRIMER mensaje persistido de un hilo
 * que siga en la cuna, el titulo pasa a ser el arranque del mensaje. RENAME
 * MANDA: un titulo que ya no es el centinela jamas se toca. Y solo el primer
 * mensaje: con filas previas no se re-titula (el centinela literal como
 * primer mensaje no deja la puerta abierta). Corre ANTES del addToHilo del
 * turno: el conteo cero del cajon es la prueba de que es el primero.
 */
export async function autoTitular(hilo: HiloDeChat, texto: string): Promise<void> {
  if (hilo.titulo !== CENTINELA) return
  if ((await elPuerto().listByHilo(hilo.id)).length > 0) return
  await elPuerto().renombrarHilo(hilo.id, tituloDe(texto))
}
