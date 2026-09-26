import { toSelfNotes } from './self-note-item'
import type { SelfNoteDraft } from './self-observation'

/** Un bloque delimitado con las notas, para agentes cuyo payload NO es un objeto
 *  donde quepa una clave hermana. Molde `omega-parse`: no-greedy, sin `g`. */
const BLOQUE = /NOTAS:\s*(\[[\s\S]*?\])\s*:END-NOTAS/

/**
 * Las dos puertas por las que una observacion entra al sistema, y UN solo
 * parser detras (ADR-085, Fase 2).
 *
 * Son dos y no una porque los agentes responden de dos formas: los que devuelven
 * un OBJETO —el escaner con `{findings, notes}`, OMEGA con su `VERDICT:{...}`—
 * llevan `notes` como clave hermana, que es el molde del analista y el que menos
 * cuesta; los que devuelven un ARRAY —el juez con `APLICA:[...]`— no tienen
 * donde colgarla y necesitan un segundo bloque.
 *
 * Las dos acaban en `toSelfNotes`, que es TOLERANTE: lo que no cumple se
 * descarta y nunca lanza. Y las dos acaban en el mismo `add`, donde vive el
 * cerco de la Fase 1 — asi que ningun agente que se enganche aqui tiene que
 * acordarse de cercar nada.
 */
export function notasDeObjeto(parsed: unknown): readonly SelfNoteDraft[] {
  if (typeof parsed !== 'object' || parsed === null) return []
  return toSelfNotes((parsed as { notes?: unknown }).notes)
}

/**
 * El mismo texto sin el bloque: lo que ve el operador y lo que se guarda en el
 * disco del CLIENTE (el plan en `docs/`). Una nota sobre FORTRESS no es del
 * proyecto, y el cerco que la redacta vive en `add`, no en ese fichero.
 */
export function sinBloqueDeNotas(texto: string): string {
  return texto.replace(BLOQUE, '').trim()
}

export function notasDeBloque(texto: string): readonly SelfNoteDraft[] {
  const match = BLOQUE.exec(texto)
  if (match === null) return []

  try {
    return toSelfNotes(JSON.parse(match[1]))
  } catch {
    // Un bloque ilegible no dice nada y tampoco rompe nada: el veredicto que lo
    // acompana ya se leyo por su cuenta, y esta es su nota al margen.
    return []
  }
}

/**
 * Las mismas notas, sin repetidas. Hace falta por UN agente: el escaner corre
 * una vez POR PARADA —doce en el recorrido de Health Flow— y las doce se topan
 * con el mismo limite de FORTRESS. Sin esto, una queja entra doce veces y el
 * backlog se inunda de lo mismo antes de que nadie lo lea.
 *
 * NO es la deduplicacion de la Fase 4, que cuenta cuantos CLIENTES vieron lo
 * mismo y es una senal que se conserva. Esta borra copias de UNA corrida del
 * MISMO agente, que no son senal sino repeticion.
 *
 * Por el texto literal de las tres piezas: dos paradas que redactan distinto
 * entran las dos, y eso es correcto — decidir que dos redacciones son la misma
 * exige cerrar el vocabulario de `area`, que es justo la Fase 4.
 */
export function sinRepetidas(notas: readonly SelfNoteDraft[]): readonly SelfNoteDraft[] {
  const vistas = new Set<string>()
  return notas.filter((n) => {
    const clave = `${n.kind}|${n.area}|${n.note}`
    if (vistas.has(clave)) return false
    vistas.add(clave)
    return true
  })
}
