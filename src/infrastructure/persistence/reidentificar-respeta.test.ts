import { describe, expect, it } from 'vitest'
import { reidentificarHallazgos } from './reidentificar-hallazgos'
import { baseConHallazgos, vivas } from './reidentificar-fixture'

describe('lo que el backfill NO funde', () => {
  it('dos TIPOS distintos en la misma linea siguen siendo dos filas', () => {
    // `allowed-files.ts:45`: el unico sitio del corpus con dos defectos REALES
    // en la misma linea. Fundirlos perderia un `path-traversal` en silencio.
    const { db } = baseConHallazgos([
      { file: 'src/domain/repair/allowed-files.ts', line: 45, tipo: 'path-traversal', simbolo: 'computeAllowedFiles', severity: 'HIGH' }, // prettier-ignore
      { file: 'src/domain/repair/allowed-files.ts', line: 45, tipo: 'validacion-asimetrica', simbolo: 'computeAllowedFiles', severity: 'LOW' } // prettier-ignore
    ])

    expect(reidentificarHallazgos(db)).toEqual({ reescritas: 2, absorbidas: 0 })
    expect(vivas(db)).toBe(2)
  })

  it('dos LINEAS distintas del mismo fichero y tipo tampoco se funden', () => {
    // Los tres de `claude-cli.ts` —:30, :51, :73— son tres problemas. Es el
    // contraejemplo que durante dos anos justifico el simbolo; lo resuelve la
    // LINEA, no el simbolo.
    const { db } = baseConHallazgos([
      { file: 'src/c.ts', line: 30, tipo: 'secret-in-argv', simbolo: 'buildArgs' },
      { file: 'src/c.ts', line: 51, tipo: 'secret-in-argv', simbolo: 'buildArgs' }
    ])

    expect(reidentificarHallazgos(db).absorbidas).toBe(0)
  })
})

describe('las claves que el backfill deja en paz', () => {
  it('las pre-ADR-067 se quedan como estan: no revientan ni se tocan', () => {
    // 98 filas reales de `mailbd` con `severidad│fichero│titulo`. Su `tipo` es
    // el DEFAULT del ALTER, no una clasificacion: fundir por un valor por
    // defecto colapsaria filas sobre algo que nadie juzgo. Su reclasificacion
    // necesita un AGENTE, y eso es otra deuda.
    const VIEJA = 'LOW|supabase/functions/x.ts|el .env esta versionado'
    const { db } = baseConHallazgos([
      { file: 'supabase/functions/x.ts', line: 2, tipo: 'otro', identity: VIEJA },
      { file: 'supabase/functions/x.ts', line: 2, tipo: 'otro', identity: VIEJA }
    ])

    expect(reidentificarHallazgos(db)).toEqual({ reescritas: 0, absorbidas: 0 })
    expect(vivas(db)).toBe(2)
    expect(db.prepare('SELECT DISTINCT identity FROM findings').all()).toEqual([
      { identity: VIEJA }
    ])
  })

  it('correrlo dos veces no cambia nada: es idempotente', () => {
    const { db } = baseConHallazgos([
      { file: 'a.ts', line: 7, tipo: 'cors-permisivo', simbolo: 'x' },
      { file: 'a.ts', line: 7, tipo: 'cors-permisivo', simbolo: 'y' }
    ])

    expect(reidentificarHallazgos(db).absorbidas).toBe(1)
    expect(reidentificarHallazgos(db).absorbidas).toBe(0)
    expect(vivas(db)).toBe(1)
  })
})
