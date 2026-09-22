import { describe, expect, it } from 'vitest'
import { leerOtros } from './filas-otro'
import { baseCon, PROYECTO } from './red-de-la-fusion-fixture'

describe('leerOtros: SOLO las vivas en otro, y nada mas', () => {
  it('no alcanza a una fila con tipo real, ni a una otro extinta, ni a otro proyecto', () => {
    const db = baseCon([
      { id: 'o1', identity: 'a.ts|1|otro', tipo: 'otro', file: 'a.ts', line: 1 },
      {
        id: 't1',
        identity: 'a.ts|2|path-traversal',
        tipo: 'path-traversal',
        file: 'a.ts',
        line: 2
      },
      {
        id: 'o2',
        identity: 'a.ts|3|otro',
        tipo: 'otro',
        lifecycle: 'EXTINCT',
        file: 'a.ts',
        line: 3
      }
    ])
    expect(leerOtros(db, PROYECTO).map((f) => f.id)).toEqual(['o1'])
    expect(leerOtros(db, 'otro-proyecto')).toEqual([])
  })

  it('trae lo que el re-tipado necesita: sitio, titulo, severidad, clave, simbolo y antiguedad', () => {
    const db = baseCon([{ id: 'o1', identity: 'a.ts|1|otro', tipo: 'otro', file: 'a.ts', line: 1, firstSeen: '2026-09-06T00:00:00Z' }]) // prettier-ignore
    expect(leerOtros(db, PROYECTO)[0]).toMatchObject({ id: 'o1', file: 'a.ts', line: 1, title: 't', severity: 'MEDIUM', identity: 'a.ts|1|otro', simbolo: 's', firstSeen: '2026-09-06T00:00:00Z' }) // prettier-ignore
  })
})
