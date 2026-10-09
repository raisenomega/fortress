import { describe, expect, it } from 'vitest'
import { GRAPH_READ_TOOLS } from '@domain/connectors/graph-mcp'
import { buildAllowedTools, buildDisallowedTools } from './build-allowed-tools'

/** PASO 99 (FRONTERA, lleva firma): libre gana SOLO WebSearch — del lado
 *  servidor, por el canal del modelo que la caja ya deja pasar (sonda verde
 *  dentro de allowedDomains:[]). Ni WebFetch (fetch local = SSRF, diferido),
 *  ni Bash, ni grafo, ni disco. Y 'lectura' queda EXACTA.
 *  PASO 137 (FRONTERA, firma de Jojo): el candado se ENSANCHA — trusted ahora
 *  DEGRADA al trabajo no confiable (web negada), y libre/cto conservan su
 *  WebSearch EXACTO pase lo que pase: son globales sin repo. */
describe('el modo libre: WebSearch y nada mas', () => {
  it("buildAllowedTools('libre') es EXACTAMENTE ['WebSearch']", () => {
    expect(buildAllowedTools('libre', false, [])).toEqual(['WebSearch'])
  })

  it('LIBRE/CTO CONSERVAN su web: la negacion del 137 jamas los alcanza', () => {
    expect(buildDisallowedTools('libre', false)).toEqual(['Bash'])
    expect(buildDisallowedTools('libre', true)).toEqual(['Bash'])
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
