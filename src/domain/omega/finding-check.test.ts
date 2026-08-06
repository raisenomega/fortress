import { describe, expect, it } from 'vitest'
import { checkFinding } from './finding-check'

const base = { id: 'f1', severity: 'MEDIUM', title: 'algo', status: 'open' } as const

describe('checkFinding', () => {
  it('archivo y linea existen: verificado (ok)', () => {
    const r = checkFinding({ ...base, file: 'src/a.ts', line: 5 }, { exists: true, lineCount: 10 })
    expect(r.verdict).toBe('ok')
    expect(r.evidence).toBe('src/a.ts:5')
  })

  it('archivo inexistente: discrepancia con evidencia', () => {
    const r = checkFinding(
      { ...base, file: 'src/fantasma.ts', line: 3 },
      { exists: false, lineCount: 0 }
    )
    expect(r.verdict).toBe('discrepancia')
    expect(r.summary).toContain('no existe')
    expect(r.evidence).toBe('src/fantasma.ts:3')
  })

  it('linea fuera de rango: discrepancia', () => {
    const r = checkFinding(
      { ...base, file: 'src/a.ts', line: 999 },
      { exists: true, lineCount: 40 }
    )
    expect(r.verdict).toBe('discrepancia')
    expect(r.summary).toContain('40 lineas')
  })

  it('sin archivo citado: no verificable (info), nunca discrepancia', () => {
    const r = checkFinding({ ...base, file: '', line: null }, { exists: false, lineCount: 0 })
    expect(r.verdict).toBe('info')
  })

  it('archivo existe y no cita linea: ok', () => {
    const r = checkFinding(
      { ...base, file: 'src/a.ts', line: null },
      { exists: true, lineCount: 1 }
    )
    expect(r.verdict).toBe('ok')
  })
})
