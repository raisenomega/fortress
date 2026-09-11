import { describe, expect, it } from 'vitest'
import type { SelfObservationRepository } from '@domain/system/self-observation-repository'
import { createMemoryDb } from './memory-db'
import { createSqliteSelfObservationRepository } from './sqlite-self-observation-repository'

const LIMITE = { kind: 'limitacion' as const, area: 'permisos-de-herramienta' as const }

const repo = (): SelfObservationRepository =>
  createSqliteSelfObservationRepository(createMemoryDb())

describe('la dedup es kind+area, y el note se queda FUERA', () => {
  it('dos notes DISTINTOS del mismo limite dejan UNA observacion', () => {
    // Las 32 filas de `limitacion/permisos MCP` del corpus tienen 32 notes
    // distintos y son EL MISMO limite. Con el note en la clave serian 32
    // senales en vez de una vista 32 veces — el baile que ADR-067 y ADR-084
    // retiraron del titulo y del simbolo.
    const r = repo()
    r.add({ ...LIMITE, sourceProject: 'acme', note: 'no pude leer con Bash' })
    r.add({ ...LIMITE, sourceProject: 'acme', note: 'el MCP me denego la lectura' })

    expect(r.listOpen()).toHaveLength(1)
  })

  it('pero otro KIND o otra AREA si abren fila: no se colapsa de mas', () => {
    const r = repo()
    r.add({ ...LIMITE, sourceProject: 'acme', note: 'n' })
    r.add({ ...LIMITE, kind: 'oportunidad', sourceProject: 'acme', note: 'n' })
    r.add({ ...LIMITE, area: 'consulta-del-grafo', sourceProject: 'acme', note: 'n' })

    expect(r.listOpen()).toHaveLength(3)
  })

  it('y una ya ATENDIDA no se reabre: eso borraria el trabajo de quien la cerro', () => {
    const r = repo()
    const o = r.add({ ...LIMITE, sourceProject: 'acme', note: 'n' })
    r.setStatus({ id: o.id, status: 'atendido', reason: 'hecho', attendedBy: 'x', attendedAt: 'hoy' }) // prettier-ignore

    r.add({ ...LIMITE, sourceProject: 'beta', note: 'volvio' })

    expect(r.listOpen()).toHaveLength(1)
    expect(r.listAll()).toHaveLength(2)
  })
})
