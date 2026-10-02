/**
 * Los tres topes del lazo, cada uno con su numero medido (ADR-110 §4 y §5).
 *
 * Salen a su propio modulo porque son lo que el operador FIRMA y lo que
 * cambiaria si cambiara de criterio; la decision de dar otra vuelta
 * (`lazo-del-motor`) es otra cosa y no se toca al mover un numero.
 */

/**
 * El tope de vueltas, firmado por el operador. Es la red contra las vueltas
 * DISTINTAS-pero-malas: la huella no las caza —cada una propone algo nuevo— y
 * son las mas caras, porque la sesion reanudada relee todo cada turno.
 */
/** Son las corridas TOTALES del generador por propuesta, no las extra: con 2,
 *  el lazo concede UNA vuelta mas sobre la primera. Es la cuenta con la que esta
 *  hecho el coste del ADR (~$1,7 por propuesta en vez de ~$0,97). */
export const TOPE_DE_VUELTAS = 2

/**
 * El tope de la propuesta en DOLARES. Cinco veces lo que costo la propuesta
 * real entera ($0,9674) y el 2 % del tope de sesion que el operador tiene
 * fijado ($250). Es una red, no el freno: con el tope de vueltas en 2 nunca
 * deberia tocarse.
 *
 * En dolares y NO en `trabajoReal`: aquel excluye `cache_read` a proposito, y
 * una vuelta con `--resume` multiplica exactamente esa relectura (+47 % medido
 * con el mismo trabajo, +355 % con trabajo nuevo). El tope de 2 000 000 de
 * tokens por propuesta permitiria ~42 vueltas: como freno de coste no frena.
 */
export const TOPE_POR_PROPUESTA_USD = 5

/** Lo que cuesta una vuelta, MEDIDO: generador reanudado + OMEGA. Se exige como
 *  margen antes de empezarla, igual que `canAffordGenerator` exige el suyo: no
 *  se predice el gasto, se reserva sitio para el. */
export const MARGEN_DE_VUELTA_USD = 0.7
