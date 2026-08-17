import {
  categoryOfDirectory,
  type CorpusCategory,
  type CorpusDescriptor,
  type CorpusDoc
} from '../project/corpus-descriptor'

const CABECERA: Readonly<Record<CorpusCategory, string>> = {
  security:
    'DOCS FIRST (seguridad): antes de emitir un veredicto, consulta lo que este ' +
    'proyecto ya tiene escrito sobre lo que protege:',
  structural:
    'DOCS FIRST (estructural): antes de una decision de arquitectura, capa o ' +
    'dependencia, consulta lo que este proyecto ya dejo firmado:',
  general:
    'DOCS FIRST: la doctrina de este proyecto esta escrita; consultala antes de ' +
    'decidir sobre disciplina o convencion:'
}

const GRAFO =
  "Los .md estan indexados en el grafo: pidelos con file_pattern '*.md' cuando el " +
  'dominio de la decision lo requiera.'

/** El nombre de la carpeta, sin la barra final ni el camino que la precede. */
const nombreDe = (dir: string): string => dir.replace(/\/$/, '').split('/').pop() ?? dir

/**
 * Los documentos de su clase si el proyecto tiene alguno; si no, los generales.
 * Degradar asi es lo honesto: un proyecto sin modelo de amenazas escrito no gana
 * nada porque le inventemos uno, y su doctrina general si le sirve al revisor.
 */
function relevantes(category: CorpusCategory, corpus: CorpusDescriptor): readonly CorpusDoc[] {
  const propios = corpus.docs.filter((doc) => doc.category === category)
  return propios.length > 0 ? propios : corpus.docs.filter((doc) => doc.category === 'general')
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
  const citados = [...relevantes(category, corpus).map((doc) => doc.path), ...propias, ...resto]

  if (citados.length === 0) return ''

  const grafo = corpus.directories.length > 0 ? ` ${GRAFO}` : ''
  return `${CABECERA[category]} ${citados.join(', ')}.${grafo}`
}
