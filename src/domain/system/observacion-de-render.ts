import { tipoDeFallo } from './observacion-de-fallo'
import type { SelfNoteDraft } from './self-observation'

/**
 * Una nota de fallo a la que le falta SOLO el area.
 *
 * El area `fallo-de-render` no existe todavia, y no por descuido: sin el
 * enganche al puente no hay quien la emita, y una clase sin emisor es inventar
 * el vocabulario (ADR-081). Tampoco cae a `otro` de paso —un cajon transitorio
 * ensucia el corpus y luego nadie se acuerda de sacarlo de ahi—.
 *
 * Asi que la nota se construye ENTERA menos esa palabra, y el hueco lo marca el
 * TIPO: esto no es un `SelfNoteDraft`, asi que `add` no lo acepta y el compilador
 * garantiza que nadie lo asiente por error antes de tiempo. La desconexion no
 * es un comentario que se pueda ignorar; es el sistema de tipos.
 *
 * El dia de la firma: `fallo-de-render` entra en `AREAS_DE_FALLO` y esto pasa a
 * ser `{ ...nota, area: 'fallo-de-render' }`. Area y emisor, en un solo gesto.
 */
export type NotaDeRenderSinArea = Omit<SelfNoteDraft, 'area'>

/**
 * El nombre del componente que rompio, sacado del `componentStack` de React.
 *
 * React lo entrega como un arbol de marcos —`\n    at ScanView (...)`— que
 * mezcla componentes de FORTRESS con elementos del DOM (`div`, `span`). El
 * primero en PascalCase es el que rompio; los de minuscula son HTML y no dicen
 * nada.
 *
 * SEGURO POR CONSTRUCCION, y medido: el bundle de produccion NO se minifica
 * —960 KB con `function ScanView() {` literal dentro—, asi que estos nombres son
 * los de verdad. Pero la garantia no descansa en eso: se exige la FORMA de un
 * identificador PascalCase, y una ruta (con barras) o una frase (con espacios)
 * no puede tenerla. Mismo filtro que `tipoDeFallo` aplica a `error.name`.
 */
const NOMBRE_DE_COMPONENTE = /^[A-Z][A-Za-z0-9_$]{0,63}$/

export function nombreDeComponente(componentStack: unknown): string {
  if (typeof componentStack !== 'string') return 'desconocido'
  for (const marco of componentStack.matchAll(/\bat\s+([^\s(]+)/g)) {
    if (NOMBRE_DE_COMPONENTE.test(marco[1])) return marco[1]
  }
  return 'desconocido'
}

/**
 * Lo que FORTRESS aprenderia cuando una vista revienta (ADR-086, embudo 3).
 *
 * Dos datos y ninguno mas: QUE componente y de QUE tipo. Ni el `message` —un
 * error de render nace de los datos que el componente pinta, y esos son del
 * cliente: los hallazgos llevan `file` y `line` del codigo auditado— ni el
 * `componentStack` entero, que son veinte lineas de arbol y harian la nota
 * ilegible ademas de romper la dedup por `kind + area`.
 *
 * Los dos crudos van al log local del operador, que no viaja. Las dos lecturas
 * otra vez, como en los embudos 1 y 2.
 */
export function observacionDeRender(componentStack: unknown, nombre: unknown): NotaDeRenderSinArea {
  return {
    kind: 'bug',
    note: `FORTRESS rompio pintando ${nombreDeComponente(componentStack)}: ${tipoDeFallo(nombre)}`
  }
}
