/**
 * Las dos escrituras que el backfill necesita y que no existian.
 *
 * Ninguna toca `first_seen`: es la historia del hallazgo, y el motivo de que la
 * fila vieja sea la que gana. Tampoco tocan `status`, que es del operador.
 */

/**
 * La reclasificacion: la fila vieja recibe el tipo y el simbolo que un agente le
 * asigno, y con ellos su identidad en la formula de hoy.
 *
 * Es el UNICO UPDATE del sistema que escribe `identity` fuera de la migracion de
 * memoria — y aquella solo alcanza a las filas que la tienen vacia, que es por
 * lo que estas quedaron congeladas con la formula vieja.
 */
export const RECLASIFICAR_FINDING = `UPDATE findings
  SET identity = @identity, tipo = @tipo, simbolo = @simbolo WHERE id = @id`

/**
 * La absorbida. Se MARCA, no se borra: 102 de las 106 propuestas de reparacion
 * apuntan a filas de este universo —dos de ellas ya MERGEADAS—, y borrar el
 * hallazgo dejaria sin explicacion el commit que lo arreglo.
 *
 * `extinct_reason` dice de quien, y `resolved_at` se queda en NULL a proposito:
 * esto no se resolvio. `MARK_EXTINCT` no vale justo por eso —escribe la fecha de
 * resolucion, que aqui seria mentira—, y ademas exige venir de ACTIVE.
 *
 * La identidad se retira con un centinela en vez de vaciarse: `SELECT_BY_IDENTITY`
 * no filtra por ciclo de vida, asi que una absorbida que conservara la clave del
 * ganador podria salir elegida en el escaneo siguiente y `TOUCH_FINDING` la
 * devolveria a ACTIVE. Vaciarla tampoco vale: caeria en el PENDING de la
 * migracion de memoria y se recalcularia sola en el arranque siguiente.
 */
export const MARCAR_FUSIONADA = `UPDATE findings
  SET lifecycle = 'EXTINCT', extinct_reason = @motivo, resolved_at = NULL, identity = @identity
  WHERE id = @id`
