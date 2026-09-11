import { describe, expect, it } from 'vitest'
import { EMPTY_USAGE } from '@domain/telemetry/token-usage'
import { toAnalysis } from './parse-analysis'

const TARGET = {
  id: 'f1',
  severity: 'LOW' as const,
  title: 't',
  file: 'a.ts',
  line: 1,
  firstSeen: '2026-01-01T00:00:00.000Z',
  tipo: 'path-traversal',
  simbolo: 'handleverify'
}
const BASE = {
  status: 'REAL',
  whatToChange: 'w',
  where: 'd',
  patternToCopy: 'p',
  doNotTouch: 'n',
  risk: 'r'
}
const leer = (obj: unknown): ReturnType<typeof toAnalysis> =>
  toAnalysis(TARGET, { result: JSON.stringify(obj), usage: EMPTY_USAGE })

describe('toAnalysis: los apuntes sobre FORTRESS', () => {
  it('viajan como una clave mas del mismo objeto', () => {
    // Un bloque aparte con su propio JSON haria que el barrido codicioso se
    // tragara los dos y el analisis entero reventara.
    const nota = { kind: 'gap', area: 'motor-de-reparacion', note: 'falto X' }
    const a = leer({ ...BASE, notes: [nota] })

    expect(a.status).toBe('REAL') // el analisis sobrevive intacto
    expect(a.notes).toEqual([nota])
  })

  it('y su `area` se CIERRA al vocabulario: lo inventado cae a `otro`', () => {
    // ADR-085, Fase 4. La nota NO se descarta por un nombre mal elegido —eso
    // perderia el aprendizaje— pero tampoco entra con un area nueva: el cajon
    // se ve y se cuenta, un valor libre por observacion no.
    const a = leer({ ...BASE, notes: [{ kind: 'gap', area: 'motor', note: 'falto X' }] })

    expect(a.notes).toEqual([{ kind: 'gap', area: 'otro', note: 'falto X' }])
  })

  it('un apunte mal escrito se descarta y los buenos se quedan', () => {
    const a = leer({
      ...BASE,
      notes: [
        { kind: 'inventado', area: 'otro', note: 'n' },
        { kind: 'bug', area: 'consulta-del-grafo', note: 'se colgo' },
        { kind: 'gap', area: 'otro', note: '   ' }
      ]
    })

    // El `kind` invalido descarta la nota entera —es vocabulario cerrado desde
    // siempre—; el `area` invalida solo cae al cajon. Dos durezas distintas, y a
    // proposito: sin kind no se sabe QUE es; sin area solo no se sabe DONDE.
    expect(a.notes).toEqual([{ kind: 'bug', area: 'consulta-del-grafo', note: 'se colgo' }])
  })

  it('una clave que no es lista tampoco rompe nada', () => {
    expect(leer({ ...BASE, notes: 'me falto una herramienta' }).notes).toBeUndefined()
  })
})
