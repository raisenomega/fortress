import { describe, expect, it } from 'vitest'
import type { SelfObservationRepository } from '@domain/system/self-observation-repository'
import { createMemoryDb } from './memory-db'
import { createSqliteSelfObservationRepository } from './sqlite-self-observation-repository'

const LIMITE = { kind: 'limitacion' as const, area: 'permisos-de-herramienta' as const }

const repo = (): SelfObservationRepository =>
  createSqliteSelfObservationRepository(createMemoryDb())

describe('vistaEn cuenta PROYECTOS distintos, no repeticiones', () => {
  it('el mismo proyecto tres veces vale UNO: doce paradas son un escaneo', () => {
    const r = repo()
    const o = r.add({ ...LIMITE, sourceProject: 'acme', note: 'a' })
    r.add({ ...LIMITE, sourceProject: 'acme', note: 'b' })
    r.add({ ...LIMITE, sourceProject: 'acme', note: 'c' })

    expect(r.vistaEn(o.id)).toBe(1)
  })

  it('tres proyectos distintos valen TRES: esa es la senal', () => {
    const r = repo()
    const o = r.add({ ...LIMITE, sourceProject: 'acme', note: 'a' })
    r.add({ ...LIMITE, sourceProject: 'beta', note: 'b' })
    r.add({ ...LIMITE, sourceProject: 'gamma', note: 'c' })

    expect(r.vistaEn(o.id)).toBe(3)
    expect(r.listOpen()).toHaveLength(1)
  })

  it('y ninguna nota se pierde: cada avistamiento guarda la suya', () => {
    // Fundir no puede costar material. La fila conserva la PRIMERA nota, y las
    // demas viven en sus avistamientos — son descripciones del mismo limite
    // desde sitios distintos, que es justo lo que ayuda a entenderlo.
    const db = createMemoryDb()
    const r = createSqliteSelfObservationRepository(db)
    const o = r.add({ ...LIMITE, sourceProject: 'acme', note: 'no pude leer con Bash' })
    r.add({ ...LIMITE, sourceProject: 'acme', note: 'el MCP me denego la lectura' })

    const notas = db.prepare('SELECT note FROM observation_sightings WHERE observation_id = ? ORDER BY note').all(o.id) // prettier-ignore
    expect(notas).toEqual([
      { note: 'el MCP me denego la lectura' },
      { note: 'no pude leer con Bash' }
    ])
    // Dos avistamientos, UN proyecto: la senal no sube por repetir.
    expect(r.vistaEn(o.id)).toBe(1)
  })
})
