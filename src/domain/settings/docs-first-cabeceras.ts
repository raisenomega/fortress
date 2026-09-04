import type { CorpusCategory } from '../project/corpus-descriptor'

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

/**
 * Cuando NO los tiene y se cae a los generales. Caer esta bien —la doctrina
 * general le sirve al revisor— pero anunciarlos bajo la promesa de la clase que
 * falta es una afirmacion falsa, y de las caras: catorce veces el analista
 * abrio un README que era la plantilla intacta de Lovable porque el prompt le
 * dijo que ahi estaba escrito "lo que el proyecto protege". Se le decia dos
 * cosas mentira de una vez: que existe esa doctrina, y que es ese fichero.
 *
 * Decirlo cambia lo que el agente hace con lo que lee: mira la doctrina general
 * sabiendo que no le van a contar el modelo de amenazas, en vez de buscarlo
 * dentro y concluir que el proyecto no protege nada.
 */
export const CABECERA_SIN_PROPIA: Readonly<Record<CorpusCategory, string>> = {
  security:
    'DOCS FIRST: este proyecto NO tiene doctrina de seguridad escrita. Lo que ' +
    'sigue es su doctrina general, que no dice que protege ni de quien:',
  structural:
    'DOCS FIRST: este proyecto NO tiene doctrina de arquitectura escrita. Lo que ' +
    'sigue es su doctrina general:',
  general: CABECERA.general
}
