/**
 * El limite de lineas por archivo del proyecto. Vive aqui y no en el motor
 * porque no es una regla del motor: es la regla de arquitectura que ESLint
 * verifica en cada commit y que ha partido en dos media docena de modulos.
 *
 * Esta DUPLICADO respecto a `eslint.config.mjs`, y a proposito: el dominio no
 * lee ficheros de configuracion. Lo que impide que el duplicado envejezca es la
 * prueba que compara los dos numeros y falla si divergen.
 */
export const MAX_LINEAS_POR_FICHERO = 75

/**
 * Las lineas de un texto, contadas COMO LAS CUENTA ESLint: fisicas, sin
 * descontar blancos ni comentarios (`skipBlankLines: false, skipComments:
 * false`). Contar de otra forma daria un veredicto que el lint desmiente.
 *
 * El salto final no suma una linea vacia: un archivo que termina en `\n` —todos
 * los de este repo— tiene las lineas que se ven, no una mas. Es lo mismo que
 * cuenta `wc -l`, comprobado contra los diecisiete archivos que hoy estan justo
 * en el limite y contra el que lo rompio.
 */
export function cuentaLineas(texto: string): number {
  if (texto === '') return 0
  const lineas = texto.split(/\r\n|\r|\n/)
  return lineas[lineas.length - 1] === '' ? lineas.length - 1 : lineas.length
}
