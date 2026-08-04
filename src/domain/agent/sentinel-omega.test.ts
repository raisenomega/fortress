import { describe, expect, it } from 'vitest'
import { agentPrompt } from './agent-prompt'
import { routeToAgent } from './agent-router'
import { SENTINEL_OMEGA } from './sentinel-omega'

describe('SENTINEL OMEGA', () => {
  it('viene activo: es el meta-auditor del sistema', () => {
    expect(SENTINEL_OMEGA.enabledByDefault).toBe(true)
  })

  it('su prompt usa la carta, no el generico name+purpose', () => {
    const prompt = agentPrompt(SENTINEL_OMEGA)
    expect(prompt).toContain('meta-auditor de FORTRESS')
    expect(prompt).toContain('Testigo, no actor')
    // La honestidad no negociable: evidencia, no intencion; falible por diseno.
    expect(prompt).toContain('archivo:linea comprobable')
    expect(prompt).toContain('Discrepancia, no intencion')
    expect(prompt).toContain('No eres infalible')
  })

  it('no se auto-enruta si esta apagado, aunque lo nombres', () => {
    const sinOmega = ['code-reviewer', 'security-reviewer'] as const
    expect(routeToAgent('omega audita esto', [...sinOmega])).not.toBe('sentinel-omega')
  })

  it('cuando esta activo, "omega" lo despacha a el', () => {
    expect(routeToAgent('sentinel omega, audita los agentes', ['sentinel-omega'])).toBe(
      'sentinel-omega'
    )
  })
})
