import type { Db } from './database'

/**
 * Los criterios 1, 2, 3 y 5 de la verificacion en caliente de una migracion de
 * fusion (ADR-071). Devuelven QUIENES violan, no un booleano: un "no cuadra"
 * sin nombres obliga a abrir la base a mano en el peor momento para hacerlo.
 * Vivian en `scripts/fase-b-verificar.ts`, fuera del `include` de vitest, asi
 * que la unica red del momento mas irreversible del sistema —una absorbida se
 * marca EXTINCT y de ahi no vuelve— no la cubria ningun gate. Aqui si.
 *
 * SIN imports en tiempo de ejecucion, como `severidad-al-fundir`: un script de
 * node solo puede cargar lo que no arrastre alias ni rutas sin extension.
 *
 * El criterio 4 —`first_seen` fila a fila— no esta, y no es un olvido: su
 * referencia es el BACKUP, otra base, y una funcion sobre un solo `Db` no lo
 * puede mirar. El 6 tampoco: vive en `@domain/project/severidad-al-fundir`.
 */
/** `criterio` como lo numera el ADR-071; `quien` es la fila —o la clave— que lo
 *  incumple, que es lo que hay que poder leer sin abrir la base. */
export interface Violacion {
  readonly criterio: number
  readonly quien: string
  readonly detalle: string
}

const VIVA = `project_id = ? AND lifecycle != 'EXTINCT'`

/** 1 — Ninguna viva conserva la identidad de la formula vieja. Ningun fichero
 *  se llama CRITICAL, asi que el GLOB no confunde una clave nueva con una vieja. */
export function conIdentidadVieja(db: Db, proyecto: string): readonly Violacion[] {
  const sql = `SELECT id, identity FROM findings WHERE ${VIVA} AND identity GLOB '[A-Z]*|*'`
  const filas = db.prepare(sql).all(proyecto) as { id: string; identity: string }[]
  return filas.map((f) => ({ criterio: 1, quien: f.id, detalle: `identidad vieja: ${f.identity}` }))
}

/** 2 — Ninguna reclasificada se quedo en 'otro'. Las exentas se pasan aparte: a
 *  esas no les falta un tipo, les falta juicio, y juzgar es del motor. */
export function sinTipoDeDefecto(
  db: Db,
  proyecto: string,
  exentas: readonly string[]
): readonly Violacion[] {
  const huecos = exentas.length === 0 ? '' : ` AND id NOT IN (${exentas.map(() => '?').join(',')})`
  const sql = `SELECT id FROM findings WHERE ${VIVA} AND tipo = 'otro'${huecos}`
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

/** 5 — Toda absorbida esta EXTINCT y sin fecha de resolucion: no se resolvio,
 *  se fusiono, y un `resolved_at` afirmaria lo que no paso. */
export function absorbidasMalMarcadas(db: Db): readonly Violacion[] {
  const sql = `SELECT id, extinct_reason AS motivo FROM findings
    WHERE extinct_reason LIKE 'fusionada-con-%'
    AND (lifecycle != 'EXTINCT' OR resolved_at IS NOT NULL)`
  const filas = db.prepare(sql).all() as { id: string; motivo: string }[]
  return filas.map((f) => ({ criterio: 5, quien: f.id, detalle: `mal marcada: ${f.motivo}` }))
}

/** Los cuatro de una vez, en orden de criterio. Vacio = la migracion cuadra. */
export function redDeLaFusion(db: Db, p: string, exentas: readonly string[]): readonly Violacion[] {
  // prettier-ignore
  return [...conIdentidadVieja(db, p), ...sinTipoDeDefecto(db, p, exentas),
    ...conIdentidadRepetida(db, p), ...absorbidasMalMarcadas(db)]
}
