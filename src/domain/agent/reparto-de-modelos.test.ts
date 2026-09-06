import { describe, expect, it } from 'vitest'
import { AGENT_IDS } from './agent'
import { AGENT_CATALOG, findAgent } from './agent-catalog'

/**
 * El reparto vigente, escrito APARTE del catalogo a proposito: si alguien cambia
 * el modelo de un agente, esta prueba lo dice en vez de dejarlo pasar como "un
 * ajuste". Cambiar con que modelo juzga el Security Reviewer no es un ajuste.
 */
const REPARTO: Readonly<Record<string, string>> = {
  'security-reviewer': 'opus',
  planner: 'opus',
  cognition: 'opus',
  'sentinel-omega': 'opus',
  'code-reviewer': 'sonnet',
  'tdd-guide': 'sonnet',
  'build-error-resolver': 'sonnet',
  'e2e-runner': 'sonnet',
  'refactor-cleaner': 'haiku',
  'code-simplifier': 'haiku',
  'opensource-sanitizer': 'haiku'
}

const cuenta = (modelo: string): number =>
  AGENT_CATALOG.filter((agent) => agent.model === modelo).length

describe('cada agente declara con que modelo corre', () => {
  it.each(AGENT_IDS)('%s lleva el modelo de su reparto', (id) => {
    expect({ id, model: findAgent(id)?.model }).toEqual({ id, model: REPARTO[id] })
  })

  it('los ONCE lo declaran: ninguno se queda heredando por descuido', () => {
    // Heredar es legitimo para un agente auto-propuesto; para los del catalogo
    // seria un olvido, y un olvido aqui se paga en dinero o en criterio.
    expect(AGENT_CATALOG.filter((agent) => agent.model !== undefined)).toHaveLength(11)
  })

  it('cuatro juzgan, cuatro ejecutan y tres barren', () => {
    expect({ opus: cuenta('opus'), sonnet: cuenta('sonnet'), haiku: cuenta('haiku') }).toEqual({
      opus: 4,
      sonnet: 4,
      haiku: 3
    })
  })

  it('el reparto de la prueba cubre a todos: ni sobra ni falta ninguno', () => {
    expect(Object.keys(REPARTO).sort()).toEqual([...AGENT_IDS].sort())
  })
})
