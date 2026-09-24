/**
 * Lo que el grafo NO indexa, dicho al agente (ADR-104, decision 1). Sale de una
 * medida sobre la base viva: 134 de 492 hallazgos (27 %) anclan en ficheros que
 * el servidor fijado no ve, y sin este aviso el «grafo primero» convierte una
 * busqueda vacia en «no hay nada» donde hay una barrera, una politica o un
 * secreto. Tres superficies MEDIDAS; la cuarta (los handlers inline que el grafo
 * funde en una funcion) se anota en DEUDAS y NO se afirma aqui, porque no se
 * midio que el aviso la corrija.
 */
export const LO_QUE_EL_GRAFO_NO_VE =
  'El grafo NO indexa: (a) los directorios ocultos .claude/, .fortress/ y .husky/, ' +
  'donde viven hooks, settings y barreras; (b) las carpetas que .gitignore excluye, ' +
  'aunque esten versionadas; (c) las politicas SQL, GRANT y buckets: de SQL ve ' +
  'funciones y tablas, no permisos. Ahi una busqueda vacia NO es ausencia: usa ' +
  'Read y Grep sin esperar nada del grafo.'
