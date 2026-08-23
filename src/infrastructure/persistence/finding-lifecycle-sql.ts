/**
 * Las transiciones del CICLO DE VIDA de un hallazgo, aparte de las consultas.
 *
 * Nacer y volver a verse ponen ACTIVE y viven con el resto del SQL de escaneo;
 * aqui estan las dos que CIERRAN: la que confirma la ausencia con evidencia y
 * la que el operador escribe a mano cuando ya lo arreglo. Juntas porque se leen
 * juntas: quien toque una tiene que ver la otra para no dejar un estado sin
 * salida, que es lo que pasaba antes con MITIGATED.
 */

/**
 * La transicion a extinto deja fecha Y MOTIVO: sin los dos no habria como
 * auditarla, y sin el motivo tampoco como distinguir una muerte con juicio de
 * una por descuido — que es exactamente lo que hubo que reconstruir a mano.
 *
 * Admite venir de ACTIVE o de MITIGATED. Mitigado es "hay un fix, falta
 * confirmar", asi que extinguirlo ES esa confirmacion: sin este segundo estado
 * de origen, un hallazgo marcado por el operador no podria cerrarse jamas.
 *
 * Quien entra aqui SI cambio: ya no lo decide el escaneo por ausencia, lo
 * decide un agente que miro el hallazgo.
 */
export const MARK_EXTINCT = `UPDATE findings SET lifecycle = 'EXTINCT', resolved_at = @at,
  extinct_reason = @motivo WHERE id = @id AND lifecycle IN ('ACTIVE', 'MITIGATED')`

/**
 * El operador declara que un hallazgo ya esta arreglado. No afirma que haya
 * desaparecido —eso lo confirma el escaneo con su doble prueba— sino que hay un
 * fix aplicado, y por eso deja de pedirle trabajo al motor sin salir del tablero.
 *
 * Solo desde ACTIVE: marcar lo ya extinto no significaria nada. `status` no se
 * toca — descartar y arreglar son cosas distintas, y mezclarlas haria que
 * descartar pareciera arreglar.
 */
export const MARK_MITIGATED = `UPDATE findings SET lifecycle = 'MITIGATED',
  mitigated_at = @at, mitigated_note = @note WHERE id = @id AND lifecycle = 'ACTIVE'`

/**
 * El mismo refresco que `TOUCH_FINDING` pero SIN tocar el ciclo de vida: se
 * actualiza lo que pudo cambiar —severidad, texto, linea, ultimo visto— y se
 * respeta el MITIGATED que el operador puso.
 *
 * Son dos sentencias y no una condicional a proposito: la decision de cual usar
 * se toma FUERA, con git delante y fuera de la transaccion, y aqui solo queda
 * elegir. Meter la condicion en el SQL habria escondido en la base una regla que
 * se lee mejor donde se decide.
 */
export const TOUCH_CONSERVANDO = `UPDATE findings SET severity = @severity, title = @title,
  file = @file, line = @line, fingerprint = @fingerprint, scan_id = @scanId,
  last_seen = @at WHERE id = @id`

/**
 * El operador deshace su propia marca: vuelve a ACTIVE y se borra la nota.
 *
 * Sin esta salida el estado seria una trampa — un hallazgo marcado por error, o
 * cuyo arreglo resulto malo, se quedaria fuera de la cola mientras su archivo no
 * cambiase, que puede ser para siempre.
 */
export const MARK_ACTIVE = `UPDATE findings SET lifecycle = 'ACTIVE',
  mitigated_at = NULL, mitigated_note = NULL WHERE id = @id AND lifecycle = 'MITIGATED'`
