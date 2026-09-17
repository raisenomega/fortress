import type { TrabajoDelTurno } from '@domain/chat/red-de-reversion'
import { git } from './git-snapshot'

/**
 * Lo que el agente edito en este turno, leido del arbol vivo bajo el checkpoint
 * (ADR-090, Fase A).
 *
 * Se apoya en la forma que deja `abrirCheckpoint`: tras el snapshot, el INDICE
 * guarda el arbol de antes y el disco el de despues, asi que `git diff` a secas
 * —sin `--cached`— es exactamente el trabajo del agente y nada mas. El WIP del
 * operador quedo stageado y no aparece aqui, que es justo lo que se quiere: se
 * juzga lo que hizo el agente, no lo que el humano tenia a medias.
 *
 * `previo` sale del SHA del checkpoint y no del indice: el indice puede moverlo
 * cualquier git que pase por encima, el commit no. Un fichero que el agente creo
 * no existia en base, y ahi `git show` falla: eso es cadena vacia, no un error.
 */
export function leerTrabajo(cwd: string, sha: string): TrabajoDelTurno | null {
  try {
    const diffText = git(cwd, ['diff'])
    const listado = git(cwd, ['diff', '--name-only']).trim()
    const tocados = listado === '' ? [] : listado.split('\n')
    return { diffText, tocados, previo: (rel) => contenidoEn(cwd, sha, rel) }
  } catch {
    return null
  }
}

/** Un fichero como estaba en el checkpoint. Vacio si no existia todavia. */
function contenidoEn(cwd: string, sha: string, relPath: string): string {
  try {
    return git(cwd, ['show', `${sha}:${relPath}`])
  } catch {
    return ''
  }
}
