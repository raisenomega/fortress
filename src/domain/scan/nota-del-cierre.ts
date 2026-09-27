/**
 * La nota que un cierre tiene DERECHO a dejar, segun lo que el escaneo vio.
 *
 * Null no es «cero»: es «este escaneo no puede puntuar». Con cero paradas
 * terminadas no vio nada, y el score del expediente vale 100 en cuanto el
 * proyecto no tenga memoria viva — era la ultima puerta por la que un escaneo
 * muerto en su primera parada pintaba «100/100 proyecto limpio» en el tablero.
 * El ESTADO de la fila ya decia ABORTADO, pero el numero manda en lo que se ve,
 * y quien lee el tablero lee el numero.
 *
 * Misma condicion EXACTA que la memoria del escaneo (`escribirMemoria`): un
 * escaneo solo afirma lo que vio. Con una parada hecha, aunque luego reviente,
 * la nota sobre lo auditado mas lo que sigue vivo SI es honesta y se escribe.
 *
 * Una sola regla y un solo sitio, porque de ella cuelgan dos consecuencias que
 * tienen que ir juntas: la nota del PROYECTO no se mueve, y la fila del escaneo
 * se queda en su score provisional en vez de heredar un numero que nadie midio.
 */
export function notaDelCierre(score: number, paradasHechas: number): number | null {
  return paradasHechas === 0 ? null : score
}
