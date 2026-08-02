import { describe, expect, it } from 'vitest'
import { countFindings, EMPTY_COUNTS } from '@domain/project/severity-counts'
import type { DetectedFinding } from '@domain/scan/detected-finding'
import { scanActivity } from './scan-activity'

const hallazgo: DetectedFinding = {
  severity: 'CRITICAL',
  title: 'SQL injection por concatenacion',
  file: 'api/routes.py',
  line: 42
}

describe('scanActivity', () => {
  it('resume el escaneo con lo que encontro', () => {
    const entries = scanActivity(
      'p1',
      'security-reviewer',
      [hallazgo],
      countFindings([hallazgo]),
      []
    )
    expect(entries[0].kind).toBe('scan')
    expect(entries[0].summary).toBe('Escaneo de seguridad: 1 CRITICAL')
  })

  it('deja una entrada por hallazgo, con su ubicacion', () => {
    const entries = scanActivity(
      'p1',
      'security-reviewer',
      [hallazgo],
      countFindings([hallazgo]),
      []
    )
    const finding = entries.find((entry) => entry.kind === 'finding')
    expect(finding).toMatchObject({ severity: 'CRITICAL', file: 'api/routes.py', line: 42 })
  })

  it('un proyecto limpio deja constancia igual', () => {
    // Saber que se escaneo y no habia nada es informacion, no ausencia de ella.
    const entries = scanActivity('p1', 'security-reviewer', [], EMPTY_COUNTS, [])
    expect(entries).toHaveLength(1)
    expect(entries[0].summary).toBe('Escaneo de seguridad: sin hallazgos')
  })

  it('no repite el mismo archivo editado dos veces', () => {
    const entries = scanActivity('p1', null, [], EMPTY_COUNTS, ['a.ts', 'a.ts', 'b.ts'])
    expect(entries.filter((entry) => entry.kind === 'edit')).toHaveLength(2)
  })
})
