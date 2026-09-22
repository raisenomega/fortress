import type { Db } from './database'
import { absorbidasMalMarcadas } from './red-de-la-fusion-marcas'
import type { Violacion } from './violacion'

export type { Violacion } from './violacion'
export { absorbidasMalMarcadas } from './red-de-la-fusion-marcas'

/**
 * Los criterios 1, 2, 3 y 5 de la verificacion en caliente de una migracion de
 * fusion (ADR-071). Devuelven QUIENES violan, no un booleano: un "no cuadra"
 * sin nombres obliga a abrir la base a mano en el peor momento. Vivian en
 * `scripts/`, fuera del `include` de vitest: la red del momento mas irreversible
 * del sistema era la unica pieza sin gate. Aqui si.
 *
 * Los scripts la cargan con `scripts/lib/cargar-ts.mjs`, que resuelve alias y
 * extensiones: por eso puede importar como cualquier modulo de `src`.
 *
 * El criterio 4 —`first_seen` fila a fila— no esta, y no es un olvido: su
 * referencia es el BACKUP, otra base, y una funcion sobre un solo `Db` no lo
 * puede mirar. El 6 tampoco: vive en `@domain/project/severidad-al-fundir`.
 */
const VIVA = `project_id = ? AND lifecycle != 'EXTINCT'`

/** Las filas que un criterio no mira, como SQL: ninguna, o `id NOT IN (...)`. */
const salvo = (ids: readonly string[]): string =>
  ids.length === 0 ? '' : ` AND id NOT IN (${ids.map(() => '?').join(',')})`

/** 1 — Ninguna viva conserva la identidad de la formula vieja. Ningun fichero
 *  se llama CRITICAL, asi que el GLOB no confunde una clave nueva con una vieja.
 *  `fueraDeAlcance`: las que ESTA migracion decidio no tocar —el paso A deja las
 *  36 sin gemela para el paso B— y que no son un fallo suyo. */
export function conIdentidadVieja(
  db: Db,
  proyecto: string,
  fueraDeAlcance: readonly string[] = []
): readonly Violacion[] {
  const sql = `SELECT id, identity FROM findings WHERE ${VIVA} AND identity GLOB '[A-Z]*|*'${salvo(fueraDeAlcance)}` // prettier-ignore
  const filas = db.prepare(sql).all(proyecto, ...fueraDeAlcance) as { id: string; identity: string }[] // prettier-ignore
  return filas.map((f) => ({ criterio: 1, quien: f.id, detalle: `identidad vieja: ${f.identity}` }))
}

/** 2 — Ninguna reclasificada se quedo en 'otro'. Las exentas se pasan aparte: a
 *  esas no les falta un tipo, les falta juicio, y juzgar es del motor. */
export function sinTipoDeDefecto(
  db: Db,
  proyecto: string,
  exentas: readonly string[]
): readonly Violacion[] {
  const sql = `SELECT id FROM findings WHERE ${VIVA} AND tipo = 'otro'${salvo(exentas)}`
  const filas = db.prepare(sql).all(proyecto, ...exentas) as { id: string }[]
  return filas.map((f) => ({ criterio: 2, quien: f.id, detalle: "se quedo en tipo 'otro'" }))
}

/** 3 — Ninguna identidad repetida entre vivas: es el estado que la fusion viene
 *  a cerrar, y si queda, `SELECT_BY_IDENTITY` devuelve una de las dos al azar. */
export function conIdentidadRepetida(db: Db, proyecto: string): readonly Violacion[] {
  const sql = `SELECT identity, COUNT(*) AS n FROM findings WHERE ${VIVA}
    GROUP BY identity HAVING n > 1`
  const filas = db.prepare(sql).all(proyecto) as { identity: string; n: number }[]
  return filas.map((f) => ({ criterio: 3, quien: f.identity, detalle: `${f.n} vivas con la clave` })) // prettier-ignore
}

/** Los cuatro de una vez, en orden de criterio. Vacio = la migracion cuadra. */
export function redDeLaFusion(
  db: Db,
  p: string,
  exentas: readonly string[],
  fueraDeAlcance: readonly string[] = []
): readonly Violacion[] {
  // prettier-ignore
  return [...conIdentidadVieja(db, p, fueraDeAlcance), ...sinTipoDeDefecto(db, p, exentas),
    ...conIdentidadRepetida(db, p), ...absorbidasMalMarcadas(db)]
}
