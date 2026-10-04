import {
  categoryOfDirectory,
  type CorpusCategory,
  type CorpusDescriptor,
  type CorpusDoc
} from '../project/corpus-descriptor'
import { sanearCampoDePrompt } from '../shared/sanear-campo-de-prompt'
import { CABECERA, cabeceraSinPropia } from './docs-first-cabeceras'

/**
 * Se decia `file_pattern '*.md'` y ese valor devuelve CERO. El parametro no
 * toma un glob ni una expresion regular: casa por SUBCADENA contra la ruta del
 * fichero. Medido contra el grafo vivo de este repo: `'*.md'` da 0 nodos,
 * `'.md'` da 1948 y `'docs/'` da 1613.
 *
 * El fallo era de los caros porque no se nota: la herramienta no protesta,
 * responde `total 0`, y la lectura ingenua es que la documentacion no esta
 * indexada. Veinte veces el agente concluyo eso y se fue a leer los ficheros a
 * mano, o dio por bueno un falso negativo. Se le enseñaba una sintaxis que no
 * existe y despues se le pedia que confiara en el resultado.
 */
const GRAFO =
  "Los .md estan indexados en el grafo: pidelos con file_pattern '.md' (o " +
  "'docs/' para una carpeta), SIEMPRE sin query: el modo query (BM25) no cubre " +
  'sus nodos y devuelve 0 aunque esten indexados. Es una SUBCADENA de la ruta, ' +
  "no un glob ni una regex: '*.md' devuelve cero y parece que no hay nada indexado."

/** El nombre de la carpeta, sin la barra final ni el camino que la precede. */
const nombreDe = (dir: string): string => dir.replace(/\/$/, '').split('/').pop() ?? dir

/**
 * Los documentos de su clase si el proyecto tiene alguno; si no, los generales,
 * DICIENDO que se cayo. Degradar es lo honesto —un proyecto sin modelo de
 * amenazas escrito no gana nada porque le inventemos uno— pero degradar en
 * silencio no: anunciaba los generales bajo la promesa de la clase que falta.
 */
function relevantes(
  category: CorpusCategory,
  corpus: CorpusDescriptor
): { readonly docs: readonly CorpusDoc[]; readonly propia: boolean } {
  const propios = corpus.docs.filter((doc) => doc.category === category)
  if (propios.length > 0) return { docs: propios, propia: true }
  return { docs: corpus.docs.filter((doc) => doc.category === 'general'), propia: false }
}

/**
 * El bloque de referencia documental, compuesto con lo que el proyecto tiene de
 * verdad. Primero lo suyo —lo que corresponde a la decision que va a tomar—, y
 * despues el resto de carpetas por si necesita mirar mas alla.
 *
 * Sin corpus devuelve cadena vacia, y quien la reciba no escribe el bloque:
 * callar es honesto, y afirmar que hay documentacion donde no la hay manda al
 * agente a buscar lo que no existe.
 */
export function buildDocsFirst(category: CorpusCategory, corpus: CorpusDescriptor): string {
  const propias = corpus.directories.filter(
    (dir) => categoryOfDirectory(nombreDe(dir)) === category
  )
  const resto = corpus.directories.filter((dir) => !propias.includes(dir))
  const { docs, propia } = relevantes(category, corpus)
  // El corpus es texto AJENO: la via DECLARADA en `.fortress/config` admite
  // cualquier cadena. Se sanea AQUI, al emitir —la frontera del prompt, donde
  // viven los demas controles—, y no en el dato, que se guarda crudo. DESPUES
  // del filtro a proposito: la categoria se decide con el nombre real, o una
  // ruta envenenada ascenderia a carpeta propia y elegiria su sitio en la cita.
  const citados = [...docs.map((doc) => doc.path), ...propias, ...resto].map(
    sanearCampoDePrompt
  )

  if (citados.length === 0) return ''

  const grafo = corpus.directories.length > 0 ? ` ${GRAFO}` : ''
  const cabecera = propia ? CABECERA[category] : cabeceraSinPropia(category)
  return `${cabecera} ${citados.join(', ')}.${grafo}`
}
