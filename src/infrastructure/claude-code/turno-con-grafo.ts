import type { CodeAgentReply } from '@domain/chat/code-agent'
import type { GrafoDelTurno } from '../graph/grafo-del-turno'

/**
 * El motivo de no haber arrancado, SIN el mensaje del error.
 *
 * Medido el 2026-09-27: cuando un argumento lleva un byte nulo, el `message` de
 * Node trae el argumento ENTERO —«Received '...'»— y ese argumento es el prompt,
 * con las citas del repo auditado dentro. Ponerlo en la respuesta lo escribiria
 * en el historial y en el stderr que ve el operador. El `code` dice lo mismo sin
 * arrastrar nada.
 */
function motivoDeNoArrancar(error: unknown): string {
  const code = (error as { code?: unknown })?.code
  return typeof code === 'string' ? `el proceso no se pudo lanzar (${code})` : 'el proceso no se pudo lanzar'
}

/**
 * El turno DENTRO de la vida de su copia del grafo (ADR-095, enmienda).
 *
 * La copia se libera pase lo que pase, y eso incluye el camino que NO estaba
 * cubierto: `spawn` puede TIRAR antes de que el hijo exista —Node se niega a
 * lanzar si un argumento lleva un byte nulo, medido— y la liberacion vivia solo
 * en el `finally` de `collectRun`, que en ese camino no se alcanza nunca. Una
 * copia del grafo por turno que no se borra es una fuga del aislamiento de clase
 * A, y se acumula una por turno fallido.
 *
 * El `finally` cubre las TRES salidas —respuesta, fallo al lanzar y rechazo de
 * la recogida— con una sola liberacion, asi que ya no hay un camino que dependa
 * de acordarse. Y un fallo al lanzar se contesta como lo que es, un CLI que no
 * arranco, en vez de subir como excepcion y matar el turno entero.
 */
export async function turnoConGrafo(
  grafo: GrafoDelTurno,
  lanzar: () => Promise<CodeAgentReply>,
  noArranco: (motivo: string) => CodeAgentReply
): Promise<CodeAgentReply> {
  try {
    return await lanzar()
  } catch (error) {
    return noArranco(motivoDeNoArrancar(error))
  } finally {
    grafo.liberar()
  }
}
