/**
 * Que dijo el gate del arbol integrado. `comandos` son los que CORRIERON, en
 * orden; si no paso, el ultimo es el que rompio. Vacio significa que no se
 * llego a correr ninguno, y entonces `detalle` dice por que.
 */
export interface MedidaDelArbol {
  readonly ok: boolean
  readonly comandos: readonly string[]
  readonly detalle: string
}

/**
 * Como se cuenta la medida en el Libro, y por que se construye desde la lista
 * de lo que corrio en vez de escribirse a mano.
 *
 * El gate del motor son TRES comandos —typecheck, lint y tests unitarios—, no
 * los cinco del gate humano: no mira la suite de integracion, ni las
 * migraciones, ni el arranque. Un asiento que dijera "re-validado" a secas
 * dejaria creer que miro las cinco, y una verificacion que exagera su alcance es
 * peor que no tenerla: retira la sospecha sin haberla resuelto.
 *
 * Por eso ninguna de estas frases nombra un comando propio. Los nombres salen de
 * la lista de los que de verdad se ejecutaron, asi que un proyecto al que le
 * falte un script —que el gate se salta y anota— produce un asiento mas corto
 * solo, y anadir un cuarto comando al gate lo alarga solo. La frase no puede
 * prometer mas de lo que hubo.
 */
export function asientoVerde(medida: MedidaDelArbol, comunes: readonly string[]): string {
  return `arbol integrado medido (${lista(medida.comandos)}) por ${lista(comunes)}`
}

export function asientoRojo(medida: MedidaDelArbol): string {
  if (medida.comandos.length === 0) return `arbol integrado sin medir: ${medida.detalle}`
  const roto = medida.comandos[medida.comandos.length - 1]
  const verdes = medida.comandos.slice(0, -1)
  const cola = verdes.length === 0 ? '' : `, verdes ${lista(verdes)}`
  return `arbol integrado rojo en ${roto}${cola}`
}

/** El caso normal: el destino se movio, pero no sobre lo que el fix toca. Se
 *  dice igual, porque "no se midio" tambien es informacion sobre que se miro. */
export const SIN_MEDIR = 'sin medir: el destino no toco ningun fichero del fix'

/** Ninguna lista vacia se cuenta como "nada": eso ya seria una afirmacion. */
function lista(nombres: readonly string[]): string {
  return nombres.length === 0 ? 'sin detalle' : nombres.join(' + ')
}
