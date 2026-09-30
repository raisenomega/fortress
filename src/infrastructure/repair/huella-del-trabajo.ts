import { createHash } from 'node:crypto'
import { diffDeCreado } from '../git/diff-de-creados'
import { git } from './repair-git'
import { readAtHead } from './worktree-file-reader'

/**
 * `sha1` de lo que el generador dejo en el worktree SIN comitear: la medida de
 * si dos corridas del mismo hallazgo proponen lo mismo (ver `MOTIVO_HUELLA`).
 *
 * LOS CREADOS VAN DENTRO, y no es un detalle: `git diff` no ve los untracked, y
 * el repo ya pago ese error una vez en el Terminal —su `diff-de-creados` lo
 * cuenta—. Medido aqui el 2026-09-30 sobre un repo de prueba: cambiando SOLO un
 * fichero nuevo, la huella sin creados NO se movio (`2c4e083c…` las dos veces) y
 * la que los cuenta paso de `68d404c5…` a `548a2fa2…`. Sin ellos, un intento que
 * reescribe entero un fichero nuevo pareceria una vuelta en redondo.
 *
 * El contenido de los creados se COMPONE (`diffDeCreado`), no se pide a git con
 * `add -N`: eso mutaria el indice, y el indice del worktree no es nuestro para
 * tocarlo por un formato de lectura.
 *
 * EL GIT VA EN LA CAJA (`./repair-git`, ADR-092 clase B) y NO el helper del
 * Terminal, que es `execFileSync` FUERA de ella: aqui el arbol es de un cliente.
 * El invariante lo permite —el worktree nace en `baseSha` sin cambios, asi que
 * `git diff` son las ediciones y todo untracked es del generador—.
 *
 * `null` cuando git no se dejo leer: sin huella se DICE, no se inventa. Un arbol
 * sin cambios si tiene huella —la de la cadena vacia—, que es otra cosa.
 */
export async function huellaDelTrabajo(worktreePath: string): Promise<string | null> {
  const editado = await git(worktreePath, ['diff'])
  if (editado.code !== 0) return null
  const otros = await git(worktreePath, ['ls-files', '--others', '--exclude-standard'])
  if (otros.code !== 0) return null

  const creados = otros.out.trim() === '' ? [] : otros.out.trim().split('\n')
  const nuevos = creados.map((rel) => diffDeCreado(rel, readAtHead(worktreePath, rel))).join('')
  return createHash('sha1')
    .update(editado.out + nuevos)
    .digest('hex')
}
