import type { ChildProcess } from 'child_process'

/**
 * Como hay que matar a un hijo, que no es lo mismo para todos.
 *
 * `proceso` es una senal al pid: vale para un binario que no se ramifica.
 * `grupo` es la senal al GRUPO entero (pid negativo), y hace falta para los que
 * se lanzaron con `detached: true`. Matar solo al lider de un grupo deja vivos a
 * sus hijos —el MCP del revisor, el `vitest` del gate—, que ademas sostienen las
 * tuberias abiertas: el proceso "no muere" y quien espera su cierre se cuelga.
 *
 * La leccion es vieja y ha vuelto tres veces: un detached es un arbol, no un
 * proceso. Por eso vive en un solo sitio y no en cada quien.
 */
export type ModoDeMuerte = 'proceso' | 'grupo'

/** Manda la senal por la via que corresponda. Nunca lanza: un grupo que ya
 *  murio no es un error, es la respuesta que se buscaba. */
export function senalAl(child: ChildProcess, signal: NodeJS.Signals, modo: ModoDeMuerte): void {
  try {
    if (modo === 'proceso') child.kill(signal)
    else if (child.pid !== undefined) process.kill(-child.pid, signal)
  } catch {
    // Ya estaba muerto: nada que escalar.
  }
}
