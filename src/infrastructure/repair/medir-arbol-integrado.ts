import type { MedidaDelArbol } from '@domain/repair/asiento-de-la-medida'
import { correrGateDeMedida, falla } from './gate-de-la-medida'
import { git, lastLine } from './repair-git'

/**
 * Que ficheros ha tocado el destino desde la base de la propuesta. `null` no es
 * "ninguno": es que no se pudo saber —una base que git ya no encuentra, un repo
 * que no responde—, y quien lo reciba tiene que medir igual. Devolver la lista
 * vacia ahi diria "el destino no se movio" sobre algo que nadie llego a mirar.
 */
export async function ficherosDelDestino(
  projectPath: string,
  baseSha: string
): Promise<readonly string[] | null> {
  const { code, out } = await git(projectPath, ['diff', '--name-only', baseSha, 'HEAD'])
  return code === 0 ? out.split('\n').filter((linea) => linea.trim() !== '') : null
}

/**
 * El destino, mergeado DENTRO del worktree de la propuesta, y el gate del motor
 * corrido sobre ese arbol: el que resultara de integrar, medido antes de que el
 * arbol vivo se entere de nada.
 *
 * El worktree es el sitio y no un checkout nuevo porque ya tiene instaladas sus
 * dependencias: medir aqui cuesta los comandos solos, y en un worktree recien
 * hecho costaria ademas el `npm ci`. Un choque TEXTUAL al mergear tampoco se
 * deja a medias: se aborta —y el abort de un worktree es suyo, no del
 * repositorio entero, que es lo que hace seguro hacerlo aqui—.
 *
 * LA SONDA SE QUEDA EN VERDE Y SE DESHACE EN ROJO, y los dos lados tienen su
 * porque. En verde, el merge de la medida ES lo que se integra: en la historia
 * real, el merge de la firma `13840d4` lleva la medida `3f98426` como segundo
 * padre — resetear el verde cambiaria lo que entra respecto de lo medido. En
 * rojo, dejarla convertia la SIGUIENTE medida en una mentira: media un arbol
 * contaminado por la sonda anterior (deuda #2, pieza 3). `ORIG_HEAD` es el tip
 * que el propio merge guardo, asi que el reset devuelve el worktree exacto.
 */
export async function medirArbolIntegrado(
  owner: string,
  worktreePath: string,
  projectPath: string,
  bin = 'npm'
): Promise<MedidaDelArbol> {
  const head = await git(projectPath, ['rev-parse', 'HEAD'])
  if (head.code !== 0) return falla('no se pudo leer el destino')

  const mensaje = 'medida del arbol integrado'
  const merge = await git(worktreePath, ['merge', '--no-ff', '-m', mensaje, head.out.trim()])
  if (merge.code !== 0) {
    await git(worktreePath, ['merge', '--abort'])
    return falla(`choque textual con el destino — ${lastLine(merge.out)}`)
  }
  const medida = await correrGateDeMedida(owner, bin, worktreePath)
  if (!medida.ok) await git(worktreePath, ['reset', '--hard', 'ORIG_HEAD'])
  return medida
}
