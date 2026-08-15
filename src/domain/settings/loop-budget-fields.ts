/**
 * Como se lee cada campo guardado. Aqui esta el COMO se limpia un valor; en
 * `loop-budget.ts`, QUE campos hay y que significa que falte cada uno.
 */

/** Dinero: coma o punto, nunca negativo, con techo para atrapar un dedazo. */
export function parseAmount(raw: string | null): number {
  if (raw === null) return 0
  const value = Number.parseFloat(raw.replace(',', '.'))
  if (!Number.isFinite(value) || value < 0) return 0
  return Math.min(value, 1000)
}

/**
 * null cuando no hay nada guardado o lo guardado no sirve; el numero cuando si.
 * Devolver 0 para el ausente aplanaria dos hechos distintos —"no configurado" y
 * "el operador escribio 0"— en el mismo valor, y quien tiene un default que
 * aplicar necesita justamente esa diferencia.
 */
export function parseCount(raw: string | null): number | null {
  if (raw === null) return null
  const value = Number.parseInt(raw, 10)
  if (!Number.isFinite(value) || value < 0) return null
  return Math.min(value, 100)
}
