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

describe('rebuildLog', () => {
  it('escribe los hallazgos como patrones que el panel lee', () => {
    const log = rebuildLog('', 'Nucleo', [secret], 80, countFindings([secret]), AT)
    const snap = parseCognitionLog(log)
    expect(snap.patterns).toHaveLength(1)
    expect(snap.patterns[0].title).toContain('Secret hardcodeado')
    expect(snap.patterns[0].severity).toBe('CRITICAL')
  })

  it('regenera patrones cada escaneo: un hallazgo arreglado desaparece', () => {
    const first = rebuildLog('', 'Nucleo', [secret], 80, countFindings([secret]), AT)
    const second = rebuildLog(first, 'Nucleo', [], 100, countFindings([]), AT)
    expect(parseCognitionLog(second).patterns).toHaveLength(0)
  })

  it('conserva las reflexiones anteriores y anade la nueva', () => {
    const first = rebuildLog('', 'Nucleo', [], 90, countFindings([]), '2026-08-01T00:00:00Z')
    const second = rebuildLog(first, 'Nucleo', [], 80, countFindings([]), '2026-08-02T00:00:00Z')
    expect(parseCognitionLog(second).reflections).toHaveLength(2)
  })

  it('el mapa de atencion pesa los archivos con mas hallazgos', () => {
    const dos: DetectedFinding = { ...secret, line: 9 }
    const log = rebuildLog('', 'Nucleo', [secret, dos], 70, countFindings([secret, dos]), AT)
    expect(parseCognitionLog(log).attention.length).toBeGreaterThan(0)
  })
})
