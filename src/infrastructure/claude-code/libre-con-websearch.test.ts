import { describe, expect, it } from 'vitest'
import { GRAPH_READ_TOOLS } from '@domain/connectors/graph-mcp'
import { buildAllowedTools, buildDisallowedTools } from './build-allowed-tools'

/** PASO 99 (FRONTERA, lleva firma): libre gana SOLO WebSearch — del lado
 *  servidor, por el canal del modelo que la caja ya deja pasar (sonda verde
 *  dentro de allowedDomains:[]). Ni WebFetch (fetch local = SSRF, diferido),
 *  ni Bash, ni grafo, ni disco. Y 'lectura' queda EXACTA: los modos de
 *  trabajo NO ganan web — ese flanco es del Bloque 2. */
describe('el modo libre: WebSearch y nada mas', () => {
  it("buildAllowedTools('libre') es EXACTAMENTE ['WebSearch']", () => {
    expect(buildAllowedTools('libre', false, [])).toEqual(['WebSearch'])
  })

  it('Bash sigue QUITADO en libre (la unica forma real de impedirlo)', () => {
    expect(buildDisallowedTools('libre')).toEqual(['Bash'])
  })
})

describe('el candado del flanco compartido: lectura queda EXACTA', () => {
  it("'lectura' sigue siendo grafo+archivos, SIN ninguna web", () => {
    const lectura = buildAllowedTools('lectura', false, [])
    expect(lectura).toEqual([...GRAPH_READ_TOOLS, 'Read', 'Grep', 'Glob', 'LS'])
    expect(lectura).not.toContain('WebSearch')
    expect(lectura).not.toContain('WebFetch')
  })
})
