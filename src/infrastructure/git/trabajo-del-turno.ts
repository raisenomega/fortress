import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { TrabajoDelTurno } from '@domain/chat/red-de-reversion'
import { diffDeCreado } from './diff-de-creados'
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
 * Y los CREADOS aparte (ADR-093 §4.4, enmienda del 18-sep), porque `git diff` no
 * ve untracked y eso dejaba dos agujeros, no uno: un turno que solo creaba
 * ficheros llegaba con `tocados` vacio y salia SIN_JUZGAR (`juez-del-turno.ts:39`),
 * y la huella de convergencia —que es `sha1(diffText)`— no se movia aunque el
 * productor hubiera cambiado el fichero nuevo entero. Por eso van a los DOS
 * campos: el nombre a `tocados`, el contenido a `diffText`.
 *
 * `previo` sale del SHA del checkpoint y no del indice: el indice puede moverlo
 * cualquier git que pase por encima, el commit no. Un fichero que el agente creo
 * no existia en base, y ahi `git show` falla: eso es cadena vacia, no un error.
 */
export function leerTrabajo(cwd: string, sha: string): TrabajoDelTurno | null {
  try {
    const creados = ficherosCreados(cwd)
    const listado = git(cwd, ['diff', '--name-only']).trim()
    const editados = listado === '' ? [] : listado.split('\n')
    const diffText =
      git(cwd, ['diff']) + creados.map((rel) => diffDeCreado(rel, enDisco(cwd, rel))).join('')
    const previo = (rel: string): string => contenidoEn(cwd, sha, rel)
    return {
      diffText,
      tocados: [...editados, ...creados],
      previo,
      actual: (rel) => enDisco(cwd, rel)
    }
  } catch {
    return null
  }
}

/**
 * Lo que el agente CREO. Tras el checkpoint todo untracked es suyo por
 * construccion (`checkpoint-transitorio.ts:40-46`: el `add -A` barrio el WIP del
 * operador al snapshot), y `leerTrabajo` solo se alcanza con un checkpoint
 * abierto (`red-de-reversion.ts:28`). Sin checkpoint no hay `diff()` que llamar.
 */
function ficherosCreados(cwd: string): readonly string[] {
  const salida = git(cwd, ['ls-files', '--others', '--exclude-standard']).trim()
  return salida === '' ? [] : salida.split('\n')
}

/** Como quedo el fichero tras el turno. Vacio si el turno lo borro. */
function enDisco(cwd: string, relPath: string): string {
  try {
    return readFileSync(join(cwd, relPath), 'utf8')
  } catch {
    return ''
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
