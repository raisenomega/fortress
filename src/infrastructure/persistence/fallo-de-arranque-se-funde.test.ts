import { readFileSync } from 'fs'
import { join } from 'path'
import { describe, expect, it } from 'vitest'
import { ESTA_INSTALACION, observacionDeFallo } from '@domain/system/observacion-de-fallo'
import { createMemoryDb } from './memory-db'
import { createSqliteSelfObservationRepository } from './sqlite-self-observation-repository'
import type { SelfObservation } from '@domain/system/self-observation'

type Repo = ReturnType<typeof createSqliteSelfObservationRepository>

const asentar = (repo: Repo, tipo: string): SelfObservation =>
  repo.add({ ...observacionDeFallo('una excepcion sin capturar', tipo), sourceProject: ESTA_INSTALACION }) // prettier-ignore

describe('un fallo de arranque en la tuberia del Nivel 1 (ADR-086)', () => {
  it('MISMA TUBERIA: pasa por `add`, y `add` lo funde en vez de duplicarlo', () => {
    // El arranque puede fallar en cada reinicio. Sin la dedup de la Fase 4, el
    // backlog se llenaria del mismo fallo repetido, que es una senal y no mil.
    const repo = createSqliteSelfObservationRepository(createMemoryDb())

    const primera = asentar(repo, 'SqliteError')
    const segunda = asentar(repo, 'SqliteError')

    expect(segunda.id).toBe(primera.id)
    expect(repo.listOpen()).toHaveLength(1)
    expect(repo.listOpen()[0].area).toBe('fallo-de-persistencia')
  })

  it('pero dos TIPOS distintos son dos huecos distintos, no uno', () => {
    const repo = createSqliteSelfObservationRepository(createMemoryDb())

    asentar(repo, 'SqliteError')
    asentar(repo, 'TypeError')

    expect(repo.listOpen().map((o) => o.area).sort()).toEqual(['fallo-de-arranque', 'fallo-de-persistencia']) // prettier-ignore
  })

  it('y su origen NO se confunde con el repo propio, que ya existe en el backlog', () => {
    // `fortress-command-center` son 207 observaciones de un agente AUDITANDO el
    // repo propio. Un fallo del proceso principal es otra cosa: la instalacion
    // rota. Fundirlos por `vistaEn` mezclaria dos senales que no se parecen.
    const repo = createSqliteSelfObservationRepository(createMemoryDb())

    const fila = asentar(repo, 'TypeError')

    expect(fila.sourceProject).toBe(ESTA_INSTALACION)
    expect(fila.sourceProject).not.toBe('fortress-command-center')
    expect(repo.vistaEn(fila.id)).toBe(1)
  })
})

/**
 * El `.catch` del arranque, fijado por lectura del fuente — molde
 * `quien-observa`: las dos formas COMPILAN IGUAL y solo una funciona.
 *
 * `app.whenReady().catch(...)` suelto es otra promesa, y esa no se rechaza
 * nunca; el manejador quedaria de adorno y el fallo seguiria sin rastro. Tiene
 * que colgar del MISMO `.then` que ensambla la app.
 */
describe('el composition root encadena su catch', () => {
  const fuente = readFileSync(join(process.cwd(), 'src/main/index.ts'), 'utf8')

  it('instala el embudo ANTES de ensamblar nada', () => {
    expect(fuente.indexOf('instalarEmbudoDeArranque')).toBeLessThan(fuente.indexOf('.whenReady()'))
  })

  it('y hay UNA sola cadena de whenReady, con su .then y su .catch', () => {
    expect(fuente.match(/\.whenReady\(\)/g)).toHaveLength(1)
    expect(fuente).toContain('.catch((error) => capturarFallo(sumideroDeFallos,')
  })
})
