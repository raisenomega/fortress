/**
 * Lo que escribe una RE-VERIFICACION (ADR-087), aparte de las transiciones que
 * ya existian.
 *
 * Las dos escriben `verificacion_note` y ninguna toca `mitigated_note`: aquella
 * es la declaracion del OPERADOR —«ya lo arregle, el fix esta en 8bda921»— y el
 * dictamen del analista es otra afirmacion, de otro autor. La primera version
 * escribia el dictamen encima y borraba la del operador; se vio en la base real
 * el 13-sep, con el sha del fix perdido.
 */

/** El analista dictamino, y el hallazgo SIGUE mitigado: o dijo OBSOLETO sin
 *  poder probarlo (`sin_prueba`), y ante la duda se conserva. */
export const ANOTAR_VERIFICACION = `UPDATE findings SET verificacion_note = @note
  WHERE id = @id AND lifecycle = 'MITIGATED'`

/**
 * El analista dijo que el problema SIGUE en el codigo: la marca de mitigado era
 * falsa y el hallazgo vuelve a la cola.
 *
 * Sin esto, confirmar y drenar no se conectaban. `vivo` —la guarda del motor—
 * exige ACTIVE, asi que un mitigado desmentido se quedaba fuera de la cola
 * mientras seguia contando para el score y bloqueando el push: castigado y
 * escondido a la vez. Es exactamente la trampa que `MARK_ACTIVE` describe en su
 * docblock, y aqui la deshace un juicio en vez de un clic.
 *
 * Limpia `mitigated_at` y `mitigated_note` porque la fila deja de estar
 * mitigada, y una columna que siga diciendo «mitigado» sobre una fila ACTIVE es
 * la misma mentira que `extinct_reason` cuenta hoy al resucitar. Lo que explica
 * la vuelta queda en `verificacion_note`, que es de quien lo dictamino.
 */
export const DEVOLVER_A_LA_COLA = `UPDATE findings SET lifecycle = 'ACTIVE',
  mitigated_at = NULL, mitigated_note = NULL, verificacion_note = @note
  WHERE id = @id AND lifecycle = 'MITIGATED'`
