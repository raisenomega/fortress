import type { SelfNoteDraft } from './self-observation'
import { areaDeFallo, tipoDeFallo } from './observacion-de-fallo'

/**
 * Un nombre de canal, o nada.
 *
 * El canal es el «donde» de un fallo de IPC, y es el equivalente exacto del
 * `tool_name` del Nivel 1: `scan:run`, `projects:add`, `settings:get`. Hoy los
 * 110 registros pasan una constante de `IPC`, asi que ninguno podria traer un
 * dato del cliente — pero eso es una auditoria de 110 sitios, no un contrato, y
 * es el mismo razonamiento que `tipoDeFallo` rechazo para `error.name`. Basta
 * que alguien registre `` `proyecto:${id}` `` para que deje de ser cierto.
 *
 * Asi que se exige la FORMA: `familia:accion`, minusculas y guiones. Una ruta
 * (con barras), una frase (con espacios) o una interpolacion no pueden tenerla.
 */
const NOMBRE_DE_CANAL = /^[a-z][a-z0-9-]*(?::[a-z0-9-]+)+$/

export function canalDeFallo(canal: unknown): string {
  return typeof canal === 'string' && NOMBRE_DE_CANAL.test(canal) ? canal : 'desconocido'
}

/**
 * Lo que FORTRESS aprende cuando revienta un handler de IPC (ADR-086, embudo 2).
 *
 * Dos datos, los dos filtrados por forma y ninguno mas: el canal y el tipo del
 * error. Ni el `message`, que va al log local del operador, ni los ARGUMENTOS,
 * que son de donde vendria lo del cliente —un `projectId`, una ruta que el
 * renderer paso—. El canal solo dice que operacion se pidio, jamas sobre que.
 *
 * `fallo-de-ipc` por defecto, pero un `SqliteError` en un canal sigue siendo una
 * rotura de persistencia: manda el tipo, y lo dice `areaDeFallo`.
 */
export function observacionDeFalloDeIpc(canal: unknown, nombre: unknown): SelfNoteDraft {
  const tipo = tipoDeFallo(nombre)
  return {
    kind: 'bug',
    area: areaDeFallo(tipo, 'fallo-de-ipc'),
    note: `FORTRESS rompio en el canal ${canalDeFallo(canal)}: ${tipo}`
  }
}

/**
 * El id de proyecto que un canal recibio, si lo recibio.
 *
 * Treinta y cinco de los 110 canales lo toman como primer argumento
 * (`scan:run`, `quality:run`, los del motor); los otros toman otra cosa o nada.
 * Filtrar por la FORMA DE UUID —que es lo que `newId` genera— hace dos cosas a
 * la vez: acierta con los 35 sin una lista que mantener, y garantiza que lo que
 * NO es un id nunca sale de aqui. Un canal cuyo primer argumento sea una ruta
 * del cliente o una clave de ajustes no la pasa a la base ni a ningun sitio.
 *
 * Solo se usa para RESOLVER el nombre del proyecto; el id no se guarda.
 */
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function idDeProyectoEnArgs(args: readonly unknown[]): string | undefined {
  const primero = args[0]
  return typeof primero === 'string' && UUID.test(primero) ? primero : undefined
}
