import { describe, expect, it } from 'vitest'
import { buildFeaturePrompt } from './build-prompt'

describe('buildFeaturePrompt', () => {
  it('nombra el proyecto, la intencion y el plan, en modo construccion', () => {
    const prompt = buildFeaturePrompt('mailbd', 'agregar login con Google', 'PASO 1: ...')
    expect(prompt).toContain('mailbd')
    expect(prompt).toContain('CONSTRUCCION')
    expect(prompt).toContain('agregar login con Google')
    expect(prompt).toContain('PASO 1')
  })

  it('lleva las reglas de creacion (convenciones del proyecto, verificar, no auth)', () => {
    const prompt = buildFeaturePrompt('p', 'x', 'y')
    expect(prompt).toContain('convenciones DEL PROYECTO')
    expect(prompt).toContain('typecheck/lint/test')
    expect(prompt).toContain('auth, pagos')
  })
})
