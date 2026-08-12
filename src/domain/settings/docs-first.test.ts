import { describe, expect, it } from 'vitest'
import { AGENT_IDS } from '../agent/agent'
import {
  DOCS_FIRST_GENERAL,
  DOCS_FIRST_SECURITY,
  DOCS_FIRST_STRUCTURAL,
  docsFirstFor
} from './docs-first'

describe('docsFirstFor', () => {
  it('manda a los ADRs a quien decide donde va un cambio', () => {
    for (const id of ['planner', 'refactor-cleaner', 'code-simplifier'] as const) {
      expect(docsFirstFor(id)).toBe(DOCS_FIRST_STRUCTURAL)
    }
  })

  it('manda al modelo de amenazas a quien juzga lo que se protege o se publica', () => {
    // opensource-sanitizer prepara el repo para publicarse: sin esta variante
    // no recibia la doctrina que le dice justamente que NO debe filtrar.
    for (const id of ['security-reviewer', 'opensource-sanitizer', 'sentinel-omega'] as const) {
      expect(docsFirstFor(id)).toBe(DOCS_FIRST_SECURITY)
    }
  })

  it('security-reviewer conserva la variante de seguridad que ya tenia', () => {
    expect(docsFirstFor('security-reviewer')).toBe(DOCS_FIRST_SECURITY)
  })

  it('el trabajo tactico se queda en la general, aunque el grafo lo trate como estructural', () => {
    // code-reviewer y tdd-guide son STRUCTURAL para el grafo: miran estructura
    // del codigo. Pero un null sin verificar no se resuelve leyendo los ADRs.
    for (const id of ['code-reviewer', 'tdd-guide', 'cognition'] as const) {
      expect(docsFirstFor(id)).toBe(DOCS_FIRST_GENERAL)
    }
  })

  it('cada agente del catalogo recibe una de las tres variantes', () => {
    // Si manana entra un agente nuevo al catalogo, este caso obliga a decidir
    // su documentacion en vez de dejarlo caer al default sin pensarlo.
    const variantes = [DOCS_FIRST_GENERAL, DOCS_FIRST_SECURITY, DOCS_FIRST_STRUCTURAL]

    expect(AGENT_IDS).toHaveLength(11)
    for (const id of AGENT_IDS) {
      expect(variantes).toContain(docsFirstFor(id))
    }
  })
})
