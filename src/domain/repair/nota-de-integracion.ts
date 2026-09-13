/**
 * Lo que se escribe en el hallazgo cuando su fix ENTRA al repo (ADR-087).
 *
 * El operador llevaba anotandolo a mano: las veintiseis marcas de su tablero
 * tienen la forma `<sha> — <que se arreglo>`, escritas una a una despues de
 * cada merge. Esto automatiza ese gesto, con dos diferencias que conviene
 * entender antes de leer una nota.
 *
 * NO LLEVA EL SHA, a proposito. El sha del merge existe y se guarda —en
 * `merge_decisions`, con su `via` y su propuesta— pero no llega hasta aqui: el
 * unico texto que viaja al asiento es la RAZON, que cuenta como entro y no que
 * commit entro. Copiarlo hasta esta nota exigiria pasarlo por
 * `apply-auto-merge`, que es INNEGOCIABLE, y duplicaria en la fila un dato que
 * ya tiene su sitio. Una sola fuente: el sha se alcanza cruzando, no leyendo.
 *
 * DICE QUIEN LO HIZO, que es lo que el sha solo no diria. La razon ya trae la
 * via —«integracion firmada por el operador», «integracion automatica», o el
 * motivo del reconciliador— y el prefijo la separa de una marca humana, que
 * empieza por un sha. Quien lea el tablero distingue de un vistazo lo que
 * declaro una persona de lo que hizo la maquina.
 *
 * Y no afirma que el problema HAYA DESAPARECIDO. Que un fix entre no prueba la
 * ausencia del defecto —esa prueba la da un agente leyendo el fichero— asi que
 * esto deja el hallazgo MITIGADO, que es justo el estado desde el que la
 * re-verificacion lo cierra.
 */
export function notaDeIntegracion(razon: string): string {
  return `el motor integro su fix: ${razon}`
}
