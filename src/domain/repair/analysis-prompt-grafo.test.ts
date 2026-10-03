import { describe, expect, it } from 'vitest'
import { EL_GRAFO } from './analysis-prompt-grafo'

/**
 * Backlog 61adf076: `search_graph` con `(?i).*ensureGraphBinary.*` devolvio
 * total=0 aunque la funcion existe e indexada — MEDIDO el 2026-10-03 contra el
 * servidor real: con `(?i)` 0 resultados, con `[eE]nsureGraphBinary` 5. El
 * flag inline no casa y falla EN SILENCIO, que es lo peor: el agente concluye
 * «no existe» y se va a Grep. El bloque del grafo lo avisa, como ADR-104
 * avisa de lo que el grafo no ve.
 */
describe('el bloque del grafo avisa de la sintaxis de name_pattern', () => {
  const texto = EL_GRAFO.join('\n')

  it('dice que (?i) no casa nada y devuelve 0 en silencio', () => {
    expect(texto).toContain('(?i)')
    expect(texto).toContain('total=0')
  })

  it('y da la alternativa que SI funciona: clases de caracteres', () => {
    expect(texto).toContain('[eE]')
  })
})
