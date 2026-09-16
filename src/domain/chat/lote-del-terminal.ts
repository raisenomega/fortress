/** Cuantos hallazgos lleva un lote como mucho. Es para probar el Terminal con
 *  calma, no para vaciar el Escaneo: diez turnos seguidos ya son una tarde. */
export const TOPE_DEL_LOTE = 10

/** Lo que se sugiere, sin forzarlo: cinco se revisan uno a uno sin perder el hilo. */
export const SUGERIDO_DEL_LOTE = 5

/**
 * Si el lote al Terminal se ofrece en este proyecto (ADR-088): donde el Terminal
 * PODRIA resolver —`resoluble`, calculado en el proceso principal: de confianza,
 * no es el repo propio y hay red git—.
 *
 * NO mira el modo: el modo decide el FLUJO, no si la casilla aparece. En
 * supervisado el operador aprueba el plan y la cola resuelve; en autonomo el
 * lote avisa de que su aprobador —OMEGA— llega con la pieza 5. Exigir autonomo
 * aqui escondia la casilla justo en el unico modo donde hoy funciona.
 */
export function loteDisponible(resoluble: boolean): boolean {
  return resoluble
}

/** El mensaje de PLAN que se precarga en el borrador: lo lee el operador antes
 *  de mandarlo, y es lo que el productor contesta con su orden de ejecucion. */
export function textoDelPlan(projectName: string, cuantos: number): string {
  return (
    `Explicame los ${cuantos} hallazgos seleccionados abiertos del ultimo escaneo ` +
    `de ${projectName}, dame tu plan y orden de ejecucion. No hace falta volver a ` +
    'escanear, solo ejecuta.'
  )
}

export interface AlternarEnLote {
  readonly seleccion: ReadonlySet<string>
  /** El que se queria anadir pasaba del tope: la seleccion vuelve igual. */
  readonly lleno: boolean
}

/** Alternar un hallazgo en el lote. Quitar siempre se puede; anadir el que
 *  pasaria del tope, no — y `lleno` lo dice para que la vista avise. */
export function alternarEnLote(previo: ReadonlySet<string>, id: string): AlternarEnLote {
  if (previo.has(id)) {
    const siguiente = new Set(previo)
    siguiente.delete(id)
    return { seleccion: siguiente, lleno: false }
  }
  if (previo.size >= TOPE_DEL_LOTE) return { seleccion: previo, lleno: true }
  return { seleccion: new Set([...previo, id]), lleno: false }
}
