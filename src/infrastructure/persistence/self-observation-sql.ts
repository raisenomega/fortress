/** Las consultas del backlog de auto-mejora. Aparte del repositorio desde que
 *  la deduplicacion de ADR-085 anadio las de avistamientos. */

export const INSERT_OBS = `INSERT INTO self_observations
  (id, source_project, kind, area, note, resolved, created_at)
  VALUES (@id, @sourceProject, @kind, @area, @note, 0, @at)`

/**
 * La clave de DEDUPLICACION: `kind` + `area`, y el `note` FUERA.
 *
 * El note lo redacta el modelo, y este proyecto ya pago dos veces por meter
 * prosa en una clave: el titulo de un hallazgo (ADR-067) y el simbolo
 * (ADR-084), los dos retirados por bailar. Las 32 observaciones de
 * `limitacion/permisos MCP` del corpus tienen 32 notes distintos y son EL MISMO
 * limite; con el note dentro serian 32 senales en vez de una vista 32 veces.
 *
 * Solo funde lo PENDIENTE: reabrir una observacion ya atendida seria borrar el
 * trabajo de quien la cerro. Si el limite vuelve despues de arreglado, merece
 * fila nueva — y que se note.
 */
export const MISMA_OBS = `SELECT * FROM self_observations
  WHERE kind = @kind AND area = @area AND status = 'pendiente'
  ORDER BY created_at LIMIT 1`

/** `OR IGNORE`: el UNIQUE decide. Repetir proyecto+nota no es un error, es la
 *  misma observacion contada otra vez, y eso es justo lo que no debe duplicar. */
export const INSERT_SIGHTING = `INSERT OR IGNORE INTO observation_sightings
  (observation_id, source_project, note, at) VALUES (@id, @sourceProject, @note, @at)`

/** La senal: PROYECTOS distintos, no avistamientos. Tres paradas del mismo
 *  escaneo son uno; tres clientes con el mismo hueco son tres. */
export const VISTA_EN = `SELECT COUNT(DISTINCT source_project) n
  FROM observation_sightings WHERE observation_id = ?`

/** De una tacada para toda la lista: N consultas por N filas era el patron que
 *  `listClosed` ya evito con su LIMIT en SQL. */
export const VISTA_EN_TODAS = `SELECT observation_id, COUNT(DISTINCT source_project) n
  FROM observation_sightings GROUP BY observation_id`

/**
 * El primer avistamiento de las filas que existian antes de que la tabla
 * existiera: su `source_project` y su `note` son exactamente eso, un agente que
 * se topo con algo en un proyecto. Sin este relleno las 350 saldrian con
 * `vistaEn: 0` y el orden las hundiria bajo cualquier observacion nueva.
 */
export const SEMBRAR_AVISTAMIENTOS = `INSERT OR IGNORE INTO observation_sightings
  (observation_id, source_project, note, at)
  SELECT id, source_project, note, created_at FROM self_observations`
