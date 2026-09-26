/**
 * De que habla una observacion que solo el LOOP puede hacer: por que se paro o
 * por que espero. CUARTA familia del vocabulario, y vive aparte por lo mismo
 * que las del TERMINAL: nace de un emisor DETERMINISTA nuevo —el motor del loop
 * al parar (`loop-engine`)— que deriva del dato ya guardado en `loop_sessions`
 * (motivo cerrado y cifra), no de un modelo redactando.
 *
 * Dos clases y no una porque la deduplicacion de ADR-085 funde por
 * `(kind, area)`: un tope del loop y un proveedor caido son dos limites
 * distintos, y en el mismo cajon sus avistamientos se enterrarian juntos.
 * Con area propia, cada clase suma avistamientos con los suyos y `vistaEn`
 * sigue diciendo cuantos proyectos distintos se toparon con lo mismo.
 *
 * NACE CON SU EMISOR, igual que las otras: `observacion-de-parada` la emite
 * desde hoy. Ninguna clase sin quien la escriba.
 */
export const AREAS_DEL_LOOP = ['parada-del-loop', 'standby-del-loop'] as const
