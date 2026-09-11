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
