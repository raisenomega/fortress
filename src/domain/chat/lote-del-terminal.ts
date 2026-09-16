/** Lo que se sugiere, sin forzarlo: cinco se revisan uno a uno sin perder el hilo. */
export const SUGERIDO_DEL_LOTE = 5

/** A partir de aqui la tanda es LARGA y la barra lo dice. No es un tope: quien
 *  quiera lanzar treinta de noche puede, y es su decision, no la nuestra. */
export const LOTE_LARGO = 10

const NOTA_DE_TANDA =
  'por tanda — los lotes grandes tardan mas; el Terminal trabaja mejor en tandas pequenas'

/** Lo que dice la barra mientras se arma el lote: cuantos van, la sugerencia, y
 *  —solo si la tanda es larga— por que conviene partirla. Avisa, no bloquea. */
export function textoDeLaTanda(elegidos: number): string {
  const base = `${elegidos} en el lote · sugerido ${SUGERIDO_DEL_LOTE}`
  return elegidos > LOTE_LARGO ? `${base} ${NOTA_DE_TANDA}` : base
}

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

/** Alternar un hallazgo en el lote. Sin tope: el cliente elige cuantos van, y la
 *  barra solo le dice cuando la tanda se hace larga. */
export function alternarEnLote(previo: ReadonlySet<string>, id: string): ReadonlySet<string> {
  const siguiente = new Set(previo)
  if (!siguiente.delete(id)) siguiente.add(id)
  return siguiente
}
