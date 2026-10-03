import type { MedidaDelArbol } from '@domain/repair/asiento-de-la-medida'
import { correrGateDeMedida, falla } from './gate-de-la-medida'
import { git, lastLine } from './repair-git'

export interface MiembroDeTanda {
  readonly id: string
  readonly worktreePath: string
  readonly branch: string
}

/**
 * La sonda del CONJUNTO (deuda #2): el arbol que resultaria de firmar la tanda
 * entera, montado en el worktree de la PRIMERA —que ya tiene su `node_modules`,
 * como la medida individual— y medido con EL MISMO gate (`gate-de-la-medida`).
 *
 * A DIFERENCIA de la medida individual, esta sonda SE DESHACE SIEMPRE, verde o
 * rojo: el anfitrion es el worktree de una propuesta REAL y su rama tiene que
 * seguir siendo el fix solo. Lo que entra al arbol vivo lo decide la firma
 * individual con su propia medida — esta sonda solo AVISA, y por eso nada
 * caduca por su rojo: no hubo firma.
 */
export async function sondaDeLaTanda(
  owner: string,
  tanda: readonly MiembroDeTanda[],
  projectPath: string,
  bin = 'npm'
): Promise<MedidaDelArbol> {
  const [anfitrion, ...resto] = tanda
  if (anfitrion === undefined) return falla('tanda vacia')
  const wt = anfitrion.worktreePath

  const tip = await git(wt, ['rev-parse', 'HEAD'])
  if (tip.code !== 0) return falla('no se pudo leer el worktree anfitrion')
  const head = await git(projectPath, ['rev-parse', 'HEAD'])
  if (head.code !== 0) return falla('no se pudo leer el destino')
  const deshacer = (): Promise<unknown> => git(wt, ['reset', '--hard', tip.out.trim()])

  for (const lado of [head.out.trim(), ...resto.map((m) => m.branch)]) {
    const merge = await git(wt, ['merge', '--no-ff', '-m', 'sonda de la tanda', lado])
    if (merge.code !== 0) {
      await git(wt, ['merge', '--abort'])
      await deshacer()
      return falla(`choque textual en la tanda con ${lado} — ${lastLine(merge.out)}`)
    }
  }
  const medida = await correrGateDeMedida(owner, bin, wt)
  await deshacer()
  return medida
}
