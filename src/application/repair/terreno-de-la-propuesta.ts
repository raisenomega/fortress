import { computeAllowedFiles } from '@domain/repair/allowed-files'
import { allowsFor } from '@domain/repair/scope-check'
import { toSlug } from '@domain/repair/slug'
import type { Admitted } from './generate-guards'
import type { GenerateDeps } from './generate-types'

export interface Correa {
  readonly allowed: string[]
  /** Globs que el proyecto abrio para un fix anclado aqui. Vacio si no declaro. */
  readonly allows: readonly string[]
}

/**
 * Donde vive el trabajo de una propuesta: su worktree y su rama.
 *
 * Se DERIVA del id y del titulo, no se guarda, asi que la vuelta del lazo
 * (ADR-110) llega al MISMO sitio que la primera sin tener que buscarlo en el
 * libro. Vive aqui, y no copiado en los dos sitios, porque dos derivaciones del
 * mismo nombre se separan en cuanto una cambie.
 */
export function rutaYRama(a: Admitted, deps: GenerateDeps): { worktreePath: string; branch: string } { // prettier-ignore
  return {
    worktreePath: `${deps.worktreeRoot}/${a.proposal.id}`,
    branch: `repair/${a.proposal.id.slice(0, 8)}-${toSlug(a.analysis.target.title)}`
  }
}

/**
 * La correa: el ancla estructurada (D10/I2.1 — la prosa del `where` es solo
 * hint) mas los globs que ESTE hallazgo activa, leidos del arbol del ancla.
 *
 * El lazo la recalcula IGUAL en cada vuelta, y eso es la frontera que el lazo no
 * cruza (ADR-110 §7): la objecion de OMEGA no entra en este calculo, asi que una
 * vuelta no puede ensanchar el terreno por mucho que el revisor lo pida.
 * Devuelve `null` cuando no hay ancla con la que atar nada.
 */
export function correaDe(a: Admitted, deps: GenerateDeps, worktreePath: string): Correa | null {
  const primary = String(a.analysis.target.file ?? '').trim()
  if (primary === '') return null
  const allowed = computeAllowedFiles({ primaryFile: primary, hint: a.analysis.where })
  const allows = allowsFor(primary, deps.scopeGroups(worktreePath))
  return { allowed, allows }
}
