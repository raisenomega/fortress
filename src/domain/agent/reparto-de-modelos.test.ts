import { describe, expect, it } from 'vitest'
import { AGENT_IDS } from './agent'
import { AGENT_CATALOG, findAgent } from './agent-catalog'
import { MODELO_DEL_PRODUCTOR } from './escalera-de-modelos'

/**
 * El reparto vigente, escrito APARTE del catalogo a proposito: si alguien cambia
 * el modelo de un agente, esta prueba lo dice en vez de dejarlo pasar como "un
 * ajuste". Cambiar con que modelo juzga el Security Reviewer no es un ajuste.
 *
 * El productor del Terminal NO esta aqui: su nivel no es un literal sino el de
 * la escalera (ADR-088, Enmienda 2), y fijarlo en esta tabla lo congelaria. El
 * CRITICO del debate (ADR-096) tampoco, y por lo mismo: su modelo tambien sale
 * de la escalera, porque un critico mas barato que el productor aprobaria.
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
  'opensource-sanitizer': 'haiku',
  'scope-classifier': 'haiku'
}

/** Los dos que derivan su modelo de la escalera quedan fuera de la tabla. */
const POR_ESCALERA: ReadonlySet<string> = new Set(['productor', 'critico'])

const FIJOS = AGENT_IDS.filter((id) => !POR_ESCALERA.has(id))
const DEL_REPARTO = AGENT_CATALOG.filter((agent) => !POR_ESCALERA.has(agent.id))

const cuenta = (modelo: string): number =>
  DEL_REPARTO.filter((agent) => agent.model === modelo).length

describe('cada agente declara con que modelo corre', () => {
  it.each(FIJOS)('%s lleva el modelo de su reparto', (id) => {
    expect({ id, model: findAgent(id)?.model }).toEqual({ id, model: REPARTO[id] })
  })

  it('los DOCE del reparto lo declaran: ninguno se queda heredando por descuido', () => {
    // Heredar es legitimo para un agente auto-propuesto; para los del catalogo
    // seria un olvido, y un olvido aqui se paga en dinero o en criterio.
    expect(DEL_REPARTO.filter((agent) => agent.model !== undefined)).toHaveLength(12)
  })

  it('cuatro juzgan, cuatro ejecutan y cuatro barren', () => {
    expect({ opus: cuenta('opus'), sonnet: cuenta('sonnet'), haiku: cuenta('haiku') }).toEqual({
      opus: 4,
      sonnet: 4,
      haiku: 4
    })
  })

  it('el reparto de la prueba cubre a todos los fijos: ni sobra ni falta ninguno', () => {
    expect(Object.keys(REPARTO).sort()).toEqual([...FIJOS].sort())
  })

  it('los de la escalera no estan en el reparto: declaran el modelo que ella les da', () => {
    expect(REPARTO.productor).toBeUndefined()
    expect(REPARTO.critico).toBeUndefined()
    expect(findAgent('critico')?.model).toBe(MODELO_DEL_PRODUCTOR)
    expect(findAgent('productor')?.model).toBe(MODELO_DEL_PRODUCTOR)
  })
})
