import { describe, expect, it } from 'vitest'
import type { DetectedFinding } from './detected-finding'
import { resolvedFindings } from './resolved-findings'

const f = (over: Partial<DetectedFinding>): DetectedFinding => ({
  severity: 'LOW',
  title: 'postureRun no pasa por guardRun',
  file: 'src/infrastructure/ipc/posture-handlers.ts',
  line: 11,
  ...over
})

describe('resolvedFindings', () => {
  it('un hallazgo que ya no aparece en el nuevo escaneo esta RESUELTO', () => {
    const posture = f({})
    const otro = f({ title: 'otro', file: 'a.ts' })
    const resolved = resolvedFindings([posture, otro], [otro]) // posture ya no aparece
    expect(resolved).toHaveLength(1)
    expect(resolved[0].title).toContain('guardRun')
  })

  it('lo que sigue apareciendo NO se extingue (por huella, no por texto reformateado)', () => {
    const previo = f({})
    const reformateado = f({ title: '  postureRun  no  pasa  por  guardRun  ' }) // misma huella
    expect(resolvedFindings([previo], [reformateado])).toHaveLength(0)
  })

  it('sin previos o todo resuelto', () => {
    expect(resolvedFindings([], [f({})])).toEqual([])
    expect(resolvedFindings([f({})], [])).toHaveLength(1)
  })
})
