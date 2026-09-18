/** Las herramientas se guardan separadas por coma: son nombres, no texto libre. */
export const SEPARATOR = ','

/**
 * El recibo va por LINEAS y no por comas: un comando lleva comas dentro, y
 * separarlo por coma haria imposible volver a leerlo entero (ADR-093 §3.3).
 *
 * Vive aqui, y no en una de las dos mitades, porque lo usan LAS DOS —leer y
 * escribir— y dos copias de un separador acaban discrepando: el dia que una
 * cambie, lo escrito deja de poder leerse y nadie se entera hasta que falta.
 */
export const RECIBO_SEPARATOR = '\n'
