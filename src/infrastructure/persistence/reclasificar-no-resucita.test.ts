import { beforeEach, describe, expect, it } from 'vitest'
import { createBench, PROJECT, type Bench } from './finding-fixture'
import { createFindingFusion } from './finding-fusion'

const ANCLA = 'src/domain/repair/allowed-files.ts'
/** El centinela REAL de una absorbida, con el formato que escribe la fusion. */
const CENTINELA = `fusionada:ganadora|${ANCLA}|path-traversal`
const NUEVA = { identidad: `${ANCLA}|path-traversal|computeallowedfiles`, tipo: 'path-traversal', simbolo: 'computeAllowedFiles' } // prettier-ignore

let bench: Bench

const sembrar = (id: string, ciclo: string, identity: string): void => {
  // prettier-ignore
  bench.db.prepare(
    `INSERT INTO findings (id, project_id, severity, title, file, line, created_at,
      identity, tipo, simbolo, lifecycle, first_seen, last_seen)
     VALUES (?, ?, 'MEDIUM', 'La correa de alcance acepta rutas con ..', ?, 45,
      '2026-08-24T00:00:00Z', ?, 'otro', '', ?, '2026-08-09T00:00:00Z', '2026-08-24T00:00:00Z')`
  ).run(id, PROJECT, ANCLA, identity, ciclo)
}
const identidadDe = (id: string): unknown =>
  (bench.db.prepare('SELECT identity FROM findings WHERE id = ?').get(id) as { identity: string })
    .identity

beforeEach(() => {
  bench = createBench()
})

/**
 * `RECLASIFICAR_FINDING` es el UNICO UPDATE del sistema que escribe `identity`, y
 * hasta hoy iba a pelo: `WHERE id = @id`. Que nunca le llegara una absorbida era
 * convencion —el filtro vive en la LECTURA, tres pasos antes, con un JSON
 * revisable en medio— y no contrato.
 */
describe('una fila ya absorbida es intocable por la reclasificacion', () => {
  it('el centinela sobrevive al UPDATE: la clave del ganador no vuelve', () => {
    sembrar('absorbida', 'EXTINCT', CENTINELA)

    createFindingFusion(bench.db).reclasificar([{ id: 'absorbida', ...NUEVA }])

    // Sin la guarda, aqui volveria `…allowed-files.ts|path-traversal|…`: la clave
    // del ganador. `SELECT_BY_IDENTITY` no filtra por ciclo de vida, asi que el
    // escaneo siguiente podria elegirla y `TOUCH_FINDING` la resucitaria a ACTIVE.
    expect(identidadDe('absorbida')).toBe(CENTINELA)
  })

  it('y la guarda no rompe lo que funciona: una viva si se reclasifica', () => {
    sembrar('viva', 'ACTIVE', `MEDIUM|${ANCLA}|la correa de alcance acepta rutas con ..`)

    createFindingFusion(bench.db).reclasificar([{ id: 'viva', ...NUEVA }])

    expect(identidadDe('viva')).toBe(NUEVA.identidad)
  })
})
