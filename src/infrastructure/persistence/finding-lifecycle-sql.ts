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
 * La transicion a extinto deja fecha: sin ella no habria como auditarla.
 *
 * Admite venir de ACTIVE o de MITIGATED. Mitigado es "hay un fix, falta
 * confirmar", asi que extinguirlo ES esa confirmacion: sin este segundo estado
 * de origen, un hallazgo marcado por el operador no podria cerrarse jamas.
 * La EVIDENCIA no cambia — la doble prueba sigue decidiendo quien entra aqui.
 */
export const MARK_EXTINCT = `UPDATE findings SET lifecycle = 'EXTINCT', resolved_at = @at
  WHERE id = @id AND lifecycle IN ('ACTIVE', 'MITIGATED')`

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
