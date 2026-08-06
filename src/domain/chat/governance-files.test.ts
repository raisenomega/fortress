import { describe, expect, it } from 'vitest'
import { buildGovernanceFiles } from './governance-files'

describe('buildGovernanceFiles', () => {
  const drafts = { 'CONSTITUTION.md': 'ley', 'CLAUDE.md': 'reglas' }

  it('mezcla los borradores aprobados con las 3 plantillas de la app', () => {
    const files = buildGovernanceFiles('MiApp', drafts)
    expect(files['CONSTITUTION.md']).toBe('ley')
    expect(files['.gitignore']).toContain('CONSTITUTION.md')
    expect(files['.env.example']).toContain('Plantilla')
    expect(files['COGNITION-LOG.md']).toContain('Generacion: 0')
  })

  it('.gitignore va PRIMERO para que el add posterior no incluya lo interno', () => {
    expect(Object.keys(buildGovernanceFiles('MiApp', drafts))[0]).toBe('.gitignore')
  })

  it('COGNITION-LOG lleva el nombre del proyecto y generacion 0', () => {
    expect(buildGovernanceFiles('Nucleo', {})['COGNITION-LOG.md']).toContain(
      '# COGNITION-LOG — Nucleo'
    )
  })
})
