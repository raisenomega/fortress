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

const crudo = (result: string): ReturnType<typeof toAnalysis> =>
  toAnalysis(TARGET, { result, usage: EMPTY_USAGE })

describe('que trozo del texto ilegible se guarda', () => {
  it('de una respuesta enorme se guarda una muestra, no el tocho entero', () => {
    const a = crudo(`{"status": ${'x'.repeat(5000)}`)

    expect(a.risk.length).toBeLessThan(400)
  })

  it('una respuesta corta se guarda entera, sin romperse al recortar', () => {
    expect(crudo('{roto').risk).toBe('analisis ilegible: {roto')
  })

  it('una respuesta vacia degrada limpia y sin muestra que ensenar', () => {
    const a = crudo('')

    expect(a.status).toBe('DESCONOCIDO')
    expect(a.risk).toBe('analisis ilegible: ')
  })

  it('el camino feliz no pasa por la degradacion', () => {
    const bueno = { status: 'REAL', whatToChange: 'w', where: 'd', patternToCopy: 'p', doNotTouch: 'n', risk: 'r' } // prettier-ignore

    expect(crudo(JSON.stringify(bueno))).toMatchObject({ status: 'REAL', risk: 'r' })
  })

  it('de una respuesta larga se guarda el FINAL, que es donde esta el fallo', () => {
    // "contenido extra despues del JSON": el principio se parece al de una
    // respuesta buena y no dice nada; lo que sobra esta detras.
    const largo = `{"status": "REAL", "whatToChange": "${'x'.repeat(2000)}"}\n{"otro": "bloque"}`

    const risk = crudo(largo).risk
    expect(risk).toContain('{"otro": "bloque"}')
    expect(risk).not.toContain('"status": "REAL"')
  })

  it('la muestra no empieza a media linea', () => {
    const conLineas = `${'y'.repeat(400)}\nsegunda linea\ntercera linea rota`

    expect(crudo(conLineas).risk).toBe('analisis ilegible: segunda linea\ntercera linea rota')
  })
})
