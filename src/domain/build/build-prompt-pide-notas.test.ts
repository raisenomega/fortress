import { describe, expect, it } from 'vitest'
import { buildFeaturePrompt, buildPlanPrompt, investigatePrompt } from './build-prompt'

/**
 * Los tres prompts de Construir NO pedian notas (ROADMAP #5, sub-pieza 3):
 * el agente que planea, investiga o construye se topa con los mismos limites
 * de FORTRESS que el escaner, y no tenia donde decirlo. Calco del juez: los
 * tres responden PROSA, asi que la peticion va como BLOQUE aparte.
 */
const PROMPTS: ReadonlyArray<readonly [string, string]> = [
  ['investigacion', investigatePrompt('P', 'que hace X')],
  ['plan', buildPlanPrompt('P', 'una feature')],
  ['construccion', buildFeaturePrompt('P', 'una feature', 'el plan')]
]

describe('los tres prompts de Construir piden sus notas', () => {
  it.each(PROMPTS)('el de %s pide el bloque NOTAS con el texto compartido', (_nombre, prompt) => {
    expect(prompt).toContain('NOTAS:[')
    expect(prompt).toContain(':END-NOTAS')
    expect(prompt).toContain('la herramienta que te ejecuta, NO el proyecto')
  })
})
