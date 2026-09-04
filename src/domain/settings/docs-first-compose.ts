import {
  categoryOfDirectory,
  type CorpusCategory,
  type CorpusDescriptor,
  type CorpusDoc
} from '../project/corpus-descriptor'
import { CABECERA, CABECERA_SIN_PROPIA } from './docs-first-cabeceras'

const GRAFO =
  "Los .md estan indexados en el grafo: pidelos con file_pattern '*.md' cuando el " +
  'dominio de la decision lo requiera.'

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
  const citados = [...docs.map((doc) => doc.path), ...propias, ...resto]

  if (citados.length === 0) return ''

  const grafo = corpus.directories.length > 0 ? ` ${GRAFO}` : ''
  const cabecera = propia ? CABECERA[category] : CABECERA_SIN_PROPIA[category]
  return `${cabecera} ${citados.join(', ')}.${grafo}`
}
