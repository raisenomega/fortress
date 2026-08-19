import { matchesGlob } from '../shared/path-glob'
import type { ScopeGroup } from './scope-groups'

export interface ScopeResult {
  readonly ok: boolean
  /** Archivos tocados que NO estaban permitidos, relativos al repo. */
  readonly violations: readonly string[]
}

/**
 * Lo que el generador NO puede tocar por mucho que el proyecto lo declare.
 *
 * Se aplica como RESTA FINAL, no como una entrada mas de la lista: si fuera una
 * entrada, su fuerza dependeria de que nadie declarase lo contrario, y el
 * `allow` lo escribe el proyecto auditado. Restando al final, ninguna
 * declaracion lo alcanza. Es el mismo principio por el que AUTONOMY_RULES_FILES
 * va siempre delante en la lista de exclusion y no se puede quitar.
 *
 * Tres, y cada una por su motivo: el archivo que declara estas reglas no puede
 * reescribirse a si mismo; nada fuera del arbol del proyecto; y el directorio
 * de git, donde un hook escrito por un fix correria con los permisos de quien
 * haga el siguiente commit.
 */
const INNEGOCIABLE: readonly string[] = ['.fortress/**', '.git/**', '**/../**', '../**']

const fuera = (file: string): boolean =>
  file.startsWith('/') || file === '..' || file.split('/').includes('..')

const vetado = (file: string): boolean =>
  fuera(file) || INNEGOCIABLE.some((patron) => matchesGlob(file, patron))

/** Los allow de los grupos que ESTE hallazgo activa. Varios `when` que casen se
 *  suman: declarar dos veces el mismo terreno no puede ser mas restrictivo. */
export function allowsFor(ancla: string, groups: readonly ScopeGroup[]): readonly string[] {
  return groups.filter((g) => matchesGlob(ancla, g.when)).flatMap((g) => g.allow)
}

/**
 * Si el fix podia tocar ese archivo. Predicado, no lista: con globs no hay
 * conjunto que enumerar, y crear un archivo es tocar algo que aun no existia
 * dentro de un terreno permitido.
 *
 * La correa universal sigue mandando donde el proyecto no declaro nada, asi que
 * un repo sin `.fortress/config` se comporta hoy como ayer.
 */
export function permitido(
  file: string,
  literales: readonly string[],
  allows: readonly string[]
): boolean {
  if (vetado(file)) return false
  return literales.includes(file) || allows.some((patron) => matchesGlob(file, patron))
}

/**
 * La correa se verifica POST-generacion contra lo que git vio, no contra lo que
 * el agente dijo tocar. Rutas relativas al repo en ambos lados.
 */
export function checkScope(
  changedFiles: readonly string[],
  allowedFiles: readonly string[],
  allows: readonly string[] = []
): ScopeResult {
  const violations = changedFiles.filter((file) => !permitido(file, allowedFiles, allows))
  return { ok: violations.length === 0, violations }
}
