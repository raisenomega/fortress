import { describe, expect, it } from 'vitest'
import { EMPTY_USAGE } from '@domain/telemetry/token-usage'
import { toAnalysis } from './parse-analysis'

const TARGET = {
  id: 'f1',
  severity: 'LOW' as const,
  title: 't',
  file: 'a.ts',
  line: 1,
  firstSeen: '2026-01-01T00:00:00.000Z'
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

describe('toAnalysis: el analisis de siempre', () => {
  it('sin la clave de apuntes, el analisis sale igual y sin apuntes', () => {
    const a = leer(BASE)
    expect(a.status).toBe('REAL')
    expect(a.whatToChange).toBe('w')
    expect(a.notes).toBeUndefined()
  })

  it('un valor que no es texto no revienta el analisis', () => {
    // El agente escribe el JSON: si cuela un numero donde iba prosa, se ignora.
    expect(leer({ ...BASE, where: 42 }).where).toBe('')
  })
})

describe('toAnalysis: los apuntes sobre FORTRESS', () => {
  it('viajan como una clave mas del mismo objeto', () => {
    // Un bloque aparte con su propio JSON haria que el barrido codicioso se
    // tragara los dos y el analisis entero reventara.
    const a = leer({ ...BASE, notes: [{ kind: 'gap', area: 'motor', note: 'falto X' }] })

    expect(a.status).toBe('REAL') // el analisis sobrevive intacto
    expect(a.notes).toEqual([{ kind: 'gap', area: 'motor', note: 'falto X' }])
  })

  it('un apunte mal escrito se descarta y los buenos se quedan', () => {
    const a = leer({
      ...BASE,
      notes: [
        { kind: 'inventado', area: 'x', note: 'n' },
        { kind: 'bug', area: 'grafo', note: 'se colgo' },
        { kind: 'gap', area: 'x', note: '   ' }
      ]
    })

    expect(a.notes).toEqual([{ kind: 'bug', area: 'grafo', note: 'se colgo' }])
  })

  it('una clave que no es lista tampoco rompe nada', () => {
    expect(leer({ ...BASE, notes: 'me falto una herramienta' }).notes).toBeUndefined()
  })
})
