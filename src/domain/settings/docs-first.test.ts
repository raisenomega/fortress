import { describe, expect, it } from 'vitest'
import { AGENT_IDS } from '../agent/agent'
import { categoryForAgent } from './docs-first'

describe('categoryForAgent', () => {
  it('manda a las decisiones firmadas a quien decide donde va un cambio', () => {
    // El productor del Terminal (ADR-088) escribe el arreglo: sin las decisiones
    // firmadas podria deshacer algo deliberado al cerrar un hallazgo.
    // El critico (ADR-096) tambien: sin las firmadas denunciaria como defecto lo
    // que un ADR decidio a proposito — el falso positivo que su carta prohibe.
    // prettier-ignore
    for (const id of ['planner', 'refactor-cleaner', 'code-simplifier', 'productor', 'critico'] as const) {
      expect(categoryForAgent(id)).toBe('structural')
    }
  })

  it('manda al modelo de amenazas a quien juzga lo que se protege o se publica', () => {
    // opensource-sanitizer prepara el repo para publicarse: sin esta variante
    // no recibia la doctrina que le dice justamente que NO debe filtrar.
    // prettier-ignore
    for (const id of ['security-reviewer', 'opensource-sanitizer', 'sentinel-omega', 'scope-classifier'] as const) {
      expect(categoryForAgent(id)).toBe('security')
    }
  })

  it('el trabajo tactico se queda en la general, aunque el grafo lo trate como estructural', () => {
    // code-reviewer y tdd-guide son STRUCTURAL para el grafo: miran estructura
    // del codigo. Pero un null sin verificar no se resuelve leyendo los ADRs.
    for (const id of ['code-reviewer', 'tdd-guide', 'cognition'] as const) {
      expect(categoryForAgent(id)).toBe('general')
    }
  })

  it('cada agente del catalogo cae en una de las tres, y ninguna otra', () => {
    // Si manana entra un agente nuevo al catalogo, este caso obliga a decidir
    // su documentacion en vez de dejarlo caer al default sin pensarlo.
    expect(AGENT_IDS).toHaveLength(14)
    for (const id of AGENT_IDS) {
      expect(['security', 'structural', 'general']).toContain(categoryForAgent(id))
    }
  })
})
