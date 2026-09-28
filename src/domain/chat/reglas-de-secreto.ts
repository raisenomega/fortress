/**
 * Las reglas del tachado, cada una con SU reemplazo.
 *
 * Salen de `tool-detail` porque aquel llego a su techo de lineas y porque son
 * otra cosa que el detalle de una herramienta: son el control que decide que NO
 * se ensena ni se escribe. Un par y no una lista suelta porque los reemplazos no
 * tienen por que ser iguales: unos tachan entero y otros necesitan conservar el
 * prefijo que hace legible la linea, y un callback compartido para las dos formas
 * cuela el desplazamiento de la coincidencia (medido: `AUTH_12***`).
 *
 * Este modulo NACE sin cambiar ni una regla: es el sitio donde caben.
 */
export type Regla = readonly [RegExp, string]

import { REGLAS_POR_NOMBRE } from './secreto-por-nombre'
import { REGLAS_POR_CONTEXTO } from './secreto-por-contexto'

/** Una clave PRIVADA en PEM (certificado y clave publica no lo son). ACOTADO y sin
 *  nada perezoso: un `[\s\S]*?` re-escanea hasta el final por cada cabecera sin pie
 *  —cuadratico— y el texto es de un repo auditado. El pie es opcional: log cortado. */
// prettier-ignore
const PEM = /-----BEGIN [A-Z ]{0,30}PRIVATE KEY-----\s{0,4}(?:[\w-]{1,20}: [^\n]{0,90}\n){0,4}\s{0,4}(?:[A-Za-z0-9+/=]{20,120}\s{0,4}){0,400}(?:(?:[A-Za-z0-9+/=]{1,19}\s{0,4})?-----END [A-Z ]{0,30}PRIVATE KEY-----)?/g

/** Por la FORMA del valor, para los que se reconocen sin ver su nombre: viajan
 *  sueltos en una URL, en un log o en la salida de un agente. */
const POR_VALOR: readonly Regla[] = [
  [/sk-ant-[\w-]{6,}/gi, '***'],
  [/\bgh[pousr]_[A-Za-z0-9]{16,}/g, '***'],
  [/\bgithub_pat_[A-Za-z0-9_]{20,}/g, '***'],
  [/Bearer\s+\S+/gi, '***'],
  [/\b[0-9a-f]{32,}\b/gi, '***'],
  [/\bA[KS]IA[0-9A-Z]{16}\b/g, '***'],
  [/\bxox[abprs]-[A-Za-z0-9-]{10,}/g, '***'],
  // Los TRES segmentos: con uno o dos se comeria cualquier base64 que empiece igual.
  [/\beyJ[\w-]{8,}\.eyJ[\w-]{8,}\.[\w-]{8,}/g, '***'],
  [PEM, '***']
]

export const REGLAS_DE_SECRETO: readonly Regla[] = [
  ...REGLAS_POR_NOMBRE,
  ...REGLAS_POR_CONTEXTO,
  ...POR_VALOR
]
