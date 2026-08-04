import { describe, expect, it } from 'vitest'
import type { OmegaEntry } from './omega-entry'
import { overview } from './omega-overview'

const entry = (verdict: OmegaEntry['verdict'], at = '2026-08-04T00:00:00Z'): OmegaEntry => ({
  id: 'x',
  at,
  projectId: 'p',
  agentId: 'a',
  kind: 'verificacion',
  verdict,
  summary: '',
  evidence: ''
})

describe('overview', () => {
  it('cuenta por veredicto y calcula integridad real', () => {
    const o = overview([entry('ok'), entry('ok'), entry('discrepancia'), entry('info')])
    expect(o.records).toBe(4)
    expect(o.oks).toBe(2)
    expect(o.discrepancies).toBe(1)
    expect(o.integrity).toBe(67) // 2 de 3 duros (info no cuenta)
  })

  it('un veto cuenta como fallo de integridad', () => {
    expect(overview([entry('ok'), entry('veto')]).integrity).toBe(50)
  })

  it('sin veredictos duros: integridad null (no inventa 100)', () => {
    const o = overview([entry('info')])
    expect(o.integrity).toBeNull()
  })

  it('log vacio: todo en cero, sin ultima marca', () => {
    const o = overview([])
    expect(o.records).toBe(0)
    expect(o.lastAt).toBeNull()
  })
})
