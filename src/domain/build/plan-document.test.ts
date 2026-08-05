import { describe, expect, it } from 'vitest'
import { planDocument } from './plan-document'

describe('planDocument', () => {
  it('incluye proyecto, intencion, plan y fecha', () => {
    const doc = planDocument(
      'MiApp',
      'agrega /health',
      'paso 1: crear ruta',
      '2026-08-05T00:00:00.000Z'
    )
    expect(doc).toContain('# Plan FORTRESS — MiApp')
    expect(doc).toContain('agrega /health')
    expect(doc).toContain('paso 1: crear ruta')
    expect(doc).toContain('2026-08-05T00:00:00.000Z')
  })
})
