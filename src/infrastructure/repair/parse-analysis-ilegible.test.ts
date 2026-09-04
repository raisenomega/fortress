import { describe, expect, it } from 'vitest'
import { isActionable } from '@domain/repair/analysis'
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

describe('toAnalysis: lo que no se deja leer no mata el motor', () => {
  it('un JSON roto sale DESCONOCIDO en vez de lanzar', () => {
    const a = crudo('{"status": "REAL", "whatToChange": ')

    expect(a.status).toBe('DESCONOCIDO')
    expect(isActionable(a)).toBe(false)
  })

  it('el texto que no se pudo leer viaja como razon, que es lo que se asienta', () => {
    // `risk` es el canal: plan-repair lo guarda como analysisReason.
    const a = crudo('API Error 529 {"type":"error"} {"type":"error"}')

    expect(a.risk).toContain('analisis ilegible')
    expect(a.risk).toContain('API Error 529')
  })
})

describe('el caso real que perdio un analisis entero (22-ago)', () => {
  it('dos bloques JSON: el barrido codicioso se los traga y todo se pierde', () => {
    // Lo que devolvio el analista sobre run-accumulator.ts: el objeto correcto,
    // con status REAL y las cinco claves llenas, y DESPUES un bloque aparte con
    // los apuntes. El barrido va del primer { al ultimo }, que esta dentro del
    // segundo bloque, asi que lo que llega a JSON.parse no es JSON.
    //
    // Este test NO pide que el parser lo aguante: fija el modo de fallo que
    // motivo reescribir el prompt. Endurecer el barrido es otra pieza, y
    // cuando llegue, este test tendra que cambiar a proposito.
    const a = crudo(
      '```json\n{"status":"REAL","whatToChange":"redactar el stderr","where":"a.ts:58",' +
        '"patternToCopy":"redactSecrets","doNotTouch":"el happy path","risk":"bajo"}\n```' +
        '\n\n**notes**:\n\n```json\n[{"kind":"gap","area":"grafo","note":"sin indice"}]\n```'
    )

    expect(a.status).toBe('DESCONOCIDO')
    expect(isActionable(a)).toBe(false)
    expect(a.risk).toContain('analisis ilegible')
    // Y lo caro: el analisis bueno estaba ahi y se fue entero.
    expect(a.whatToChange).toBe('')
  })

  it('el mismo contenido en UN solo objeto se lee perfecto', () => {
    const a = crudo(
      '```json\n{"status":"REAL","whatToChange":"redactar el stderr","where":"a.ts:58",' +
        '"patternToCopy":"redactSecrets","doNotTouch":"el happy path","risk":"bajo",' +
        '"notes":[{"kind":"gap","area":"grafo","note":"sin indice"}]}\n```'
    )

    expect(a.status).toBe('REAL')
    expect(a.whatToChange).toBe('redactar el stderr')
    expect(a.notes).toHaveLength(1)
  })
})
