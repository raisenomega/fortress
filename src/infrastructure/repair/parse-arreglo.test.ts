import { describe, expect, it } from 'vitest'
import type { Candidate } from '@domain/repair/select-target'
import { toAnalysis } from './parse-analysis'

const T = { id: 'f1' } as unknown as Candidate
const con = (extra: string): string =>
  `{"status":"REAL","whatToChange":"w","where":"d","patternToCopy":"p","doNotTouch":"n","risk":"r"${extra}}`

describe('el parser lee arreglo como fichero y linea, sin fiarse (ADR-102 §2)', () => {
  it('lo lee cuando viene bien formado', () => {
    expect(toAnalysis(T, { result: con(',"arreglo":{"file":"src/x.ts","line":4}') }).arreglo).toEqual({ file: 'src/x.ts', line: 4 }) // prettier-ignore
    expect(toAnalysis(T, { result: con(',"arreglo":{"file":"src/x.ts","line":null}') }).arreglo).toEqual({ file: 'src/x.ts', line: null }) // prettier-ignore
  })

  it('ausente o torcido, no viaja: el guard lo tratara como «no dijo»', () => {
    expect(toAnalysis(T, { result: con('') }).arreglo).toBeUndefined()
    expect(toAnalysis(T, { result: con(',"arreglo":"src/x.ts"') }).arreglo).toBeUndefined()
    expect(toAnalysis(T, { result: con(',"arreglo":{"file":"src/x.ts"}') }).arreglo).toBeUndefined()
  })
})
