/** Cuantas propuestas caben en una pagina de firma. */
export const POR_PAGINA = 15

/** Una pagina resuelta: cual es, cuantas hay, y que trozo del array mostrar. */
export interface Pagina {
  readonly pagina: number
  readonly paginas: number
  readonly desde: number
  readonly hasta: number
}

/**
 * Resuelve que trozo de la cola se ve, con la pagina pedida ACOTADA al rango
 * real.
 *
 * El acotado no es defensivo de mas: firmar encoge la cola bajo los pies del
 * operador. Con dieciseis propuestas hay dos paginas; en cuanto se firma una
 * quedan quince y la segunda pagina deja de existir. Sin acotar, quien estuviera
 * mirandola se quedaba delante de una lista vacia sin haber hecho nada raro.
 *
 * Siempre hay al menos una pagina, incluso con la cola vacia: "pagina 1 de 0"
 * no significa nada.
 */
export function paginar(total: number, pedida: number, porPagina: number = POR_PAGINA): Pagina {
  const paginas = Math.max(1, Math.ceil(total / porPagina))
  const pagina = Math.min(Math.max(1, Math.trunc(pedida)), paginas)
  const desde = (pagina - 1) * porPagina
  return { pagina, paginas, desde, hasta: Math.min(total, desde + porPagina) }
}
