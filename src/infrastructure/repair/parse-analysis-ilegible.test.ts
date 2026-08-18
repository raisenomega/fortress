import { describe, expect, it } from 'vitest'
import { isActionable } from '@domain/repair/analysis'
import { EMPTY_USAGE } from '@domain/telemetry/token-usage'
import { toAnalysis } from './parse-analysis'

const TARGET = { id: 'f1', severity: 'LOW' as const, title: 't', file: 'a.ts', line: 1 }

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
