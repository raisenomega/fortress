import type { Analysis } from './analysis'

/**
 * La marca de "no se dejo leer" sobre un Analysis: el prefijo con el que la
 * razon lo anuncia, y como se reconoce despues.
 *
 * Vive en el dominio porque tiene dos lados que no se conocen: lo ESCRIBE el
 * parser de infraestructura al degradar, y lo LEE quien todavia tiene el texto
 * crudo delante y debe decidir si conservarlo entero.
 */
export const ILEGIBLE = 'analisis ilegible: '

/** Si el Analysis salio de una respuesta que no se dejo leer. Quien tenga el
 *  crudo debe guardarlo: en el asiento solo queda una muestra, y con una
 *  muestra el fallo no se reproduce. */
export function noSeDejoLeer(a: Analysis): boolean {
  return a.risk.startsWith(ILEGIBLE)
}
