import {
  CANONICAL_DOCS,
  categoryOf,
  CORPUS_DIRS,
  type CorpusCategory
} from '../project/corpus-descriptor'

/** Cuando el proyecto SI tiene documentos de la clase que toca. */
export const CABECERA: Readonly<Record<CorpusCategory, string>> = {
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

const CLASE: Readonly<Record<CorpusCategory, string>> = {
  security: 'de seguridad',
  structural: 'de arquitectura',
  general: ''
}

/**
 * Cuando NO se encontro y se cae a los generales. Caer esta bien —la doctrina
 * general le sirve al revisor— pero anunciarlos bajo la promesa de la clase que
 * falta es una afirmacion falsa, y de las caras: catorce veces el analista
 * abrio un README que era la plantilla intacta de Lovable porque el prompt le
 * dijo que ahi estaba escrito "lo que el proyecto protege".
 *
 * Y decia «NO tiene doctrina», que es afirmar una ausencia que nadie midio: el
 * descubridor busca NOMBRES EXACTOS en la raiz, en las carpetas de corpus y en
 * la declaracion del proyecto. Un proyecto con su doctrina en otro fichero —una
 * tabla de gaps, medido el 20-sep— la tenia y se le negaba. Lo honesto es lo
 * que se hizo: no se encontro, y aqui es donde se miro. Las rutas se DERIVAN de
 * la tabla del corpus, que es la que busca el descubridor: una sola fuente.
 */
export function cabeceraSinPropia(category: CorpusCategory): string {
  if (category === 'general') return CABECERA.general
  const nombres = CANONICAL_DOCS.filter((n) => categoryOf(n) === category).join(', ')
  return (
    `DOCS FIRST: no encontre doctrina ${CLASE[category]} escrita en las rutas conocidas ` +
    `(${nombres} en la raiz, ni en ${CORPUS_DIRS.join('/, ')}/, ni declarada en la ` +
    'configuracion del proyecto). Lo que sigue es su doctrina general' +
    (category === 'security' ? ', que no dice que protege ni de quien' : '') +
    '; si vive en otro sitio, dilo en "notes":'
  )
}
