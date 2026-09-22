/** `criterio` como lo numera el ADR-071; `quien` es la fila —o la clave— que lo
 *  incumple, que es lo que hay que poder leer sin abrir la base. */
export interface Violacion {
  readonly criterio: number
  readonly quien: string
  readonly detalle: string
}
