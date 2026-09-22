import type { Db } from './database'

/** Lo que el backfill necesita de una fila zombi: donde esta y como se llamaba. */
export interface FilaZombi {
  readonly id: string
  readonly file: string
  readonly line: number | null
  readonly title: string
  readonly severity: string
  readonly identity: string
  readonly tipo: string
  readonly first_seen: string
}

/** Una viva con la clave de hoy: entre ellas viven las gemelas de las zombis. */
export interface FilaDeHoy {
  readonly id: string
  readonly file: string
  readonly line: number | null
  readonly title: string
  readonly tipo: string
  readonly identity: string
}

/**
 * La FORMA de la clave de antes de ADR-067 (`severidad|fichero|titulo`): ningun
 * fichero se llama CRITICAL, asi que el GLOB no confunde una clave nueva con
 * una vieja. Es el mismo del criterio 1 de la red, con el signo cambiado.
 *
 * Por la forma y NUNCA por `tipo = 'otro'`: en mailbd hay 5 filas ADR-084 que
 * el escaner de hoy clasifico `otro` legitimamente —hallazgos sanos— y un
 * selector por tipo se las llevaria por delante (medido el 2026-09-22).
 */
export const IDENTIDAD_VIEJA = `identity GLOB '[A-Z]*|*'`

const VIVA = `project_id = ? AND lifecycle != 'EXTINCT'`

const ZOMBIS = `SELECT id, file, line, title, severity, identity, tipo, first_seen FROM findings
  WHERE ${VIVA} AND ${IDENTIDAD_VIEJA} ORDER BY file, line, first_seen`

const DE_HOY = `SELECT id, file, line, title, tipo, identity FROM findings
  WHERE ${VIVA} AND NOT (${IDENTIDAD_VIEJA})`

/** Las vivas que siguen con la identidad vieja, y SOLO esas. */
export const leerZombis = (db: Db, proyecto: string): readonly FilaZombi[] =>
  db.prepare(ZOMBIS).all(proyecto) as FilaZombi[]

/** Las vivas con la clave de hoy, incluidas las que el escaner dejo en `otro`. */
export const leerVivasDeHoy = (db: Db, proyecto: string): readonly FilaDeHoy[] =>
  db.prepare(DE_HOY).all(proyecto) as FilaDeHoy[]
