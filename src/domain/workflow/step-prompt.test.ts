import { describe, expect, it } from 'vitest'
import { buildStepPrompt } from './step-prompt'

const step = { agentId: 'security-reviewer', task: 'Audita seguridad' } as const
const base = { projectName: 'Nucleo', previous: [], known: [] }

describe('buildStepPrompt y el modo', () => {
  it('le dice al agente que esta en autonomo cuando lo esta', () => {
    // El bug: sin esto el agente respondia "supervisado por defecto" aunque el
    // operador tuviera el boton en autonomo, porque nadie se lo decia.
    const prompt = buildStepPrompt(step, { ...base, mode: 'autonomo' })
    expect(prompt).toContain('MODO AUTONOMO')
    expect(prompt).not.toContain('MODO SUPERVISADO')
  })

  it('en supervisado lo dice igual de claro', () => {
    const prompt = buildStepPrompt(step, { ...base, mode: 'supervisado' })
    expect(prompt).toContain('MODO SUPERVISADO')
  })

  it('sigue incluyendo el encargo y el contrato de informe', () => {
    const prompt = buildStepPrompt(step, { ...base, mode: 'supervisado' })
    expect(prompt).toContain('Audita seguridad')
    expect(prompt).toContain('findings')
  })
})
