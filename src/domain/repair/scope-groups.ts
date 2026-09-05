import { rutas } from './auto-merge-fields'
import { globDeAlcanceValido, globsDeAlcance } from './glob-de-alcance'

/**
 * Un grupo de co-modificacion declarado por el proyecto: "cuando el hallazgo
 * caiga aqui, el fix puede tocar y crear esto". Es DIRIGIDO a proposito. Un
 * grupo simetrico —dos globs que se abren mutuamente— deja que un hallazgo en
 * la capa ancha reescriba la estrecha, que casi nunca es lo que se quiso decir.
 */
export interface ScopeGroup {
  readonly name: string
  /** Glob del ANCLA: el fichero del hallazgo que activa el grupo. */
  readonly when: string
  /** Globs que ese fix puede tocar y crear. */
  readonly allow: readonly string[]
}

interface RawGroup {
  readonly name?: unknown
  readonly when?: unknown
  readonly allow?: unknown
}

/**
 * El `when` se filtra igual que el `allow`, y no es simetria por gusto: un
 * `when` universal activa el grupo para CUALQUIER hallazgo, asi que su allow
 * —por acotado que sea— pasa a regir siempre. Filtrar solo el allow dejaria la
 * mitad de la puerta abierta.
 */
function grupo(raw: RawGroup): ScopeGroup | null {
  const declarado = rutas(raw.allow)
  const allow = declarado === null ? null : globsDeAlcance(declarado)
  if (typeof raw.name !== 'string' || typeof raw.when !== 'string' || allow === null) return null
  if (raw.name === '' || !globDeAlcanceValido(raw.when)) return null
  return { name: raw.name, when: raw.when, allow }
}

/**
 * Los grupos declarados en `.fortress/config`. Un grupo mal escrito invalida la
 * lista entera y no solo a si mismo: el operador quiso decir algo y no se sabe
 * que, asi que se cae a la correa universal —el sesgo seguro que ya sigue el
 * resto del archivo— en vez de aplicar la mitad que se entendio.
 */
export function parseScopeGroups(raiz: unknown): readonly ScopeGroup[] {
  const scope = (raiz as { scope?: { groups?: unknown } } | null)?.scope
  if (scope === undefined || scope === null) return []
  if (!Array.isArray(scope.groups)) return []

  const grupos = scope.groups.map((raw) => grupo(raw as RawGroup))
  return grupos.every((g): g is ScopeGroup => g !== null) ? grupos : []
}
