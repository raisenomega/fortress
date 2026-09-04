import { describe, expect, it } from 'vitest'
import { EMPTY_USAGE } from '@domain/telemetry/token-usage'
import type { Candidate } from '@domain/repair/select-target'
import { toAnalysis } from './parse-analysis'

// prettier-ignore
const TARGET: Candidate = { id: 'f1', severity: 'LOW', title: 't', file: 'src/a.ts', line: 1, firstSeen: '2026-08-01T00:00:00.000Z', tipo: 'path-traversal', simbolo: 'handleverify' }

const leer = (texto: string): ReturnType<typeof toAnalysis> =>
  toAnalysis(TARGET, { result: texto, usage: EMPTY_USAGE })

describe('el parser trae la evidencia del OBSOLETO, o no la trae', () => {
  it('la lee cuando viene en forma', () => {
    const a = leer('{"status":"OBSOLETO","evidencia":{"marcador":"execFile(","forma":"ausente"}}')
    expect(a.evidencia).toEqual({ marcador: 'execFile(', forma: 'ausente' })
  })

  it('una evidencia torcida no viaja a medias', () => {
    expect(leer('{"status":"OBSOLETO","evidencia":{"forma":"ausente"}}').evidencia).toBeUndefined()
    expect(leer('{"status":"OBSOLETO","evidencia":"el commit d9e3194"}').evidencia).toBeUndefined()
  })

  it('el analisis de siempre sigue sin evidencia, y eso es lo normal en un REAL', () => {
    expect(leer('{"status":"REAL","risk":"bajo"}').evidencia).toBeUndefined()
  })

  it('el status ausente sigue cayendo en DESCONOCIDO, ahora sin poder matar nada', () => {
    const a = leer('{"whatToChange":"nada","risk":"ninguno"}')
    expect(a.status).toBe('DESCONOCIDO')
    expect(a.evidencia).toBeUndefined()
  })
})

describe('sin factura del CLI el analisis no inventa un coste', () => {
  it('tokensUsed queda en cero y la corrida se asentara como no medida', () => {
    // `RunOut` sin `usage` es el CLI que murio antes de facturar. Antes llegaba
    // aqui como EMPTY_USAGE y era indistinguible de una corrida gratis.
    const a = toAnalysis(TARGET, { result: '{"status":"REAL"}' })
    expect(a.tokensUsed).toBe(0)
  })
})
