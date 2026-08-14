import { entero, flag, rutas, severidades } from './auto-merge-fields'
import { AUTONOMY_RULES_FILES, COMMON_SENSITIVE_AREAS } from './auto-merge-blacklist'
import { DEFAULT_POLICY, type AutoMergePolicy } from './auto-merge-policy'

/**
 * Tres estados, no dos. Distinguir "no configurado" de "configurado e
 * ilegible" es deliberado: la primera es una ausencia de intencion y hereda el
 * default; la segunda es una intencion que NO se puede verificar, y ahi el
 * sesgo seguro es retirar la integracion automatica, no adivinar.
 */
export type ConfigState =
  | { readonly kind: 'not-present' }
  | { readonly kind: 'valid'; readonly policy: AutoMergePolicy }
  | { readonly kind: 'invalid'; readonly reason: string }

interface RawAutoMerge {
  readonly enabled?: unknown
  readonly severities?: unknown
  readonly maxDiffLines?: unknown
  readonly maxFiles?: unknown
  readonly blacklist?: unknown
}

const mal = (campo: string, espera: string): ConfigState => ({ kind: 'invalid', reason: `${campo}: ${espera}` }) // prettier-ignore

/**
 * Texto del archivo -> politica. Un campo ausente hereda el default; un campo
 * PRESENTE pero mal formado invalida el archivo entero, porque el operador
 * quiso decir algo y no se sabe qué.
 *
 * La fusion de la lista de exclusion es ASIMETRICA a proposito: los archivos
 * que gobiernan la autonomia van SIEMPRE delante y el proyecto no puede
 * quitarlos. Solo elige que sustituye a las areas sensibles por defecto.
 */
export function parseAutoMergeConfig(texto: string): ConfigState {
  let raiz: { autoMerge?: RawAutoMerge }
  try {
    raiz = JSON.parse(texto) as { autoMerge?: RawAutoMerge }
  } catch {
    return { kind: 'invalid', reason: 'no es JSON valido' }
  }

  const auto = raiz?.autoMerge
  if (auto === undefined || auto === null || typeof auto !== 'object') {
    return { kind: 'invalid', reason: 'falta el bloque autoMerge' }
  }

  const on = auto.enabled === undefined ? DEFAULT_POLICY.enabled : flag(auto.enabled)
  if (on === null) return mal('enabled', 'true o false')

  const sev = auto.severities === undefined ? DEFAULT_POLICY.severities : severidades(auto.severities) // prettier-ignore
  if (sev === null) return mal('severities', 'lista no vacia de severidades conocidas')

  const lineas = auto.maxDiffLines === undefined ? DEFAULT_POLICY.maxDiffLines : entero(auto.maxDiffLines) // prettier-ignore
  if (lineas === null) return mal('maxDiffLines', 'entero positivo')

  const archivos = auto.maxFiles === undefined ? DEFAULT_POLICY.maxFiles : entero(auto.maxFiles)
  if (archivos === null) return mal('maxFiles', 'entero positivo')

  const propia = auto.blacklist === undefined ? COMMON_SENSITIVE_AREAS : rutas(auto.blacklist)
  if (propia === null) return mal('blacklist', 'lista de patrones de ruta')

  const policy: AutoMergePolicy = {
    enabled: on,
    severities: sev,
    maxDiffLines: lineas,
    maxFiles: archivos,
    blacklist: [...AUTONOMY_RULES_FILES, ...propia]
  }
  return { kind: 'valid', policy }
}
