import { categoryOf, type CorpusDescriptor, type CorpusDoc } from './corpus-descriptor'

/** Tres estados, como la lectura de la politica: ausente no es lo mismo que roto. */
export type CorpusConfig =
  | { readonly kind: 'not-present' }
  | { readonly kind: 'valid'; readonly corpus: CorpusDescriptor }
  | { readonly kind: 'invalid'; readonly reason: string }

const lista = (raw: unknown): readonly string[] | null =>
  Array.isArray(raw) && raw.every((r) => typeof r === 'string') ? (raw as string[]) : null

/** El nombre del fichero de una ruta, sin traer `path`: el dominio no toca Node. */
const nombre = (ruta: string): string => ruta.split(/[\\/]/).pop() ?? ruta

/**
 * Un documento declarado se cita aunque no sea canonico —el operador declara
 * justamente lo que la convencion no encuentra—, pero su categoria no se
 * adivina: cae a general.
 */
const declarado = (path: string): CorpusDoc => ({
  path,
  category: categoryOf(nombre(path)) ?? 'general'
})

/**
 * Texto del fichero -> corpus declarado. La clave ausente deja mandar al
 * descubrimiento; una clave PRESENTE y mal formada es una intencion que no se
 * puede cumplir, y quien la escribio tiene que enterarse.
 */
export function parseCorpusConfig(texto: string): CorpusConfig {
  let raiz: { corpus?: unknown }
  try {
    raiz = JSON.parse(texto) as { corpus?: unknown }
  } catch {
    return { kind: 'invalid', reason: 'no es JSON valido' }
  }

  const corpus = raiz?.corpus
  if (corpus === undefined) return { kind: 'not-present' }
  if (corpus === null || typeof corpus !== 'object') {
    return { kind: 'invalid', reason: 'corpus: objeto con docs y/o directories' }
  }

  const { docs, directories } = corpus as { docs?: unknown; directories?: unknown }
  const rutas = docs === undefined ? [] : lista(docs)
  if (rutas === null) return { kind: 'invalid', reason: 'corpus.docs: lista de rutas' }

  const carpetas = directories === undefined ? [] : lista(directories)
  if (carpetas === null) return { kind: 'invalid', reason: 'corpus.directories: lista de rutas' }

  return { kind: 'valid', corpus: { docs: rutas.map(declarado), directories: carpetas } }
}
