import { describe, expect, it } from 'vitest'
import { ILEGIBLE, noSeDejoLeer } from '@domain/repair/analysis-ilegible'
import { EMPTY_USAGE } from '@domain/telemetry/token-usage'
import type { Candidate } from '@domain/repair/select-target'
import { toAnalysis } from './parse-analysis'

const TARGET = { id: 'f1', file: 'a.ts', title: 't', severity: 'LOW' } as unknown as Candidate
const leer = (result: string): ReturnType<typeof toAnalysis> =>
  toAnalysis(TARGET, { result, usage: EMPTY_USAGE })

describe('el analista degradado se reconoce, para poder guardar su crudo', () => {
  it('respuesta ilegible: degrada a DESCONOCIDO y queda marcada como tal', () => {
    const a = leer('no hay JSON aqui, solo prosa')
    expect(a.status).toBe('DESCONOCIDO')
    expect(a.risk.startsWith(ILEGIBLE)).toBe(true)
    expect(noSeDejoLeer(a)).toBe(true)
  })

  it('la muestra de la razon sigue siendo una COLA recortada, no el texto entero', () => {
    const largo = `${'prosa del analista sin ningun objeto que leer. '.repeat(60)}FINAL`
    const a = leer(largo)
    expect(a.risk.length).toBeLessThan(largo.length)
    expect(a.risk.endsWith('FINAL')).toBe(true)
    expect(noSeDejoLeer(a)).toBe(true)
  })

  it('respuesta legible: ni se marca ni se pide crudo', () => {
    const a = leer('{"status":"REAL","whatToChange":"x","risk":"acotado"}')
    expect(a.status).toBe('REAL')
    expect(a.risk).toBe('acotado')
    expect(noSeDejoLeer(a)).toBe(false)
  })

  it('un analisis legible cuyo riesgo empieza por otra cosa no se confunde', () => {
    const a = leer('{"status":"REAL","risk":"analisis del riesgo: acotado"}')
    expect(noSeDejoLeer(a)).toBe(false)
  })
})
