import type { MotivoCierre } from './motivo-cierre'

/**
 * Si la corrida de este escaneo YA quedo asentada antes de llegar al cierre.
 *
 * `fallo` y solo `fallo`, y la correspondencia es exacta, no una suposicion:
 * `claude-scanner` avisa del intento cuando NO hubo informe —proceso caido o
 * informe ilegible— y `asentarIntentoFallido` lo asienta con su factura real;
 * y el recorrido cierra con `fallo` exactamente en esa rama, la del
 * `if (!salida.ok)`. Un cierre por cualquier otro motivo llega con la parada
 * terminada y sin nadie que haya asentado nada.
 *
 * Existe para que el cierre NO escriba una segunda fila. Aquella salia con
 * duracion cero y coste cero, y una factura de ceros afirma que la corrida
 * salio gratis —lo que el propio `asentarIntentoFallido` advierte que no se
 * puede decir—. Dos filas para una corrida, y la segunda mintiendo.
 *
 * En la duda se prefiere DUPLICAR antes que perder: por eso es una lista de un
 * solo motivo y no «todo lo que no sea completo». Perder la unica factura de
 * una corrida cara es el error caro; anotarla dos veces, el barato.
 */
export const yaHayFactura = (motivo: MotivoCierre): boolean => motivo === 'fallo'
