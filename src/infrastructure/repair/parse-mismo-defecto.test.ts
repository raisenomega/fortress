import { describe, expect, it } from 'vitest'
import type { Candidate } from '@domain/repair/select-target'
import { toAnalysis } from './parse-analysis'

const T = { id: 'f1' } as unknown as Candidate
const con = (extra: string): string =>
  `{"status":"REAL","whatToChange":"w","where":"d","patternToCopy":"p","doNotTouch":"n","risk":"r"${extra}}`

describe('el parser lee mismoDefectoQue como lista de ids, sin fiarse', () => {
  it('lo lee cuando viene, y tira lo que no es texto', () => {
    expect(
      toAnalysis(T, { result: con(',"mismoDefectoQue":["a",3,"b",""]') }).mismoDefectoQue
    ).toEqual(['a', 'b'])
  })

  it('ausente o torcido, no viaja', () => {
    expect(toAnalysis(T, { result: con('') }).mismoDefectoQue).toBeUndefined()
    expect(toAnalysis(T, { result: con(',"mismoDefectoQue":"a"') }).mismoDefectoQue).toBeUndefined()
  })
})
