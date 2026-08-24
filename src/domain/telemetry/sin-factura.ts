/**
 * Lo que ocurrio y no se pudo medir en una ventana de tiempo.
 *
 * Las dos cifras estan MEDIDAS: cuantas corridas fueron y cuanto tiempo real
 * sumaron. El dinero que les falta no aparece aqui —ni en ningun otro sitio—
 * porque el CLI murio antes de enviarlo, y estimarlo subestimaria justo donde
 * duele: las que se quedan sin factura son las largas, o sea las caras.
 *
 * Existe para que un total no se lea como si fuera completo. La casa ya sabia
 * decir "sin coste reportado" al pintar una cifra y "parcial" cuando a un score
 * le faltaba una dimension; esto es lo mismo para el gasto.
 */
export interface SinFactura {
  readonly runs: number
  readonly durationMs: number
}

/** Todo medido: no hay nada que advertir, y por eso no se ensena nada. */
export const NADA_SIN_MEDIR: SinFactura = { runs: 0, durationMs: 0 }
