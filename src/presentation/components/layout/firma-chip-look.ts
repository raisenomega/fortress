/** Corto: cabe en la barra. El numero es el que se puede firmar, no el que hay. */
export const etiquetaFirma = (cuantas: number): string => `Firma: ${cuantas}`

/**
 * Lo que la etiqueta no dice: que este numero NO es el del chip del motor.
 *
 * El chip del motor cuenta toda propuesta viva —incluidas las que estan siendo
 * analizadas o generadas—, y ninguna de esas se puede firmar. Este cuenta solo
 * las paradas en el gate o ya juzgadas: las que esperan un acto del operador.
 */
export function tituloFirma(cuantas: number): string {
  const cuerpo = cuantas === 1 ? '1 propuesta espera' : `${cuantas} propuestas esperan`
  return `${cuerpo} tu firma — pasaron el gate y no avanzan sin ti`
}
