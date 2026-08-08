import { describe, expect, it } from 'vitest'
import { countFindings } from '../project/severity-counts'
import { parseCognitionLog } from './parse-cognition-log'
import { rebuildLog } from './rebuild-log'
import type { DetectedFinding } from '../scan/detected-finding'

const AT = '2026-08-04T10:00:00Z'
const secret: DetectedFinding = {
  severity: 'CRITICAL',
  title: 'Secret hardcodeado',
  file: 'src/a.ts',
  line: 3
}
const active = (log: string): number =>
  parseCognitionLog(log).patterns.filter((p) => p.status === 'ACTIVE').length
const extinct = (log: string): number =>
  parseCognitionLog(log).patterns.filter((p) => p.status === 'EXTINTO').length

describe('rebuildLog', () => {
  it('escribe los hallazgos como patrones ACTIVE que el panel lee', () => {
    const log = rebuildLog('', 'Nucleo', [secret], [], 80, countFindings([secret]), AT)
    const snap = parseCognitionLog(log)
    expect(snap.patterns[0].title).toContain('Secret hardcodeado')
    expect(snap.patterns[0].severity).toBe('CRITICAL')
  })

  it('un hallazgo resuelto NO desaparece: se registra EXTINTO con evidencia', () => {
    const first = rebuildLog('', 'Nucleo', [secret], [], 80, countFindings([secret]), AT)
    // segundo escaneo: 0 hallazgos, secret resuelto
    const second = rebuildLog(first, 'Nucleo', [], [secret], 100, countFindings([]), AT)
    expect(active(second)).toBe(0) // ya no esta activo
    expect(extinct(second)).toBe(1) // pero quedo extinto, no se cayo
    expect(second).toContain('el escaneo ya no lo reporta (ubicacion original src/a.ts:3)')
  })

  it('los EXTINTOS se ACUMULAN entre escaneos (no se regeneran)', () => {
    const otro: DetectedFinding = { ...secret, title: 'Otro', file: 'src/b.ts', line: 9 }
    const s1 = rebuildLog('', 'Nucleo', [secret, otro], [], 70, countFindings([secret, otro]), AT)
    const s2 = rebuildLog(s1, 'Nucleo', [otro], [secret], 85, countFindings([otro]), AT)
    const s3 = rebuildLog(s2, 'Nucleo', [], [otro], 100, countFindings([]), AT)
    expect(extinct(s3)).toBe(2) // secret (s2) + otro (s3) acumulados
  })

  it('conserva las reflexiones anteriores y anade la nueva', () => {
    const a = rebuildLog('', 'Nucleo', [], [], 90, countFindings([]), '2026-08-01T00:00:00Z')
    const b = rebuildLog(a, 'Nucleo', [], [], 80, countFindings([]), '2026-08-02T00:00:00Z')
    expect(parseCognitionLog(b).reflections).toHaveLength(2)
  })
})
