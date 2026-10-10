import { describe, expect, it } from 'vitest'
import { GRAPH_READ_TOOLS } from '@domain/connectors/graph-mcp'
import { buildAllowedTools, buildDisallowedTools } from './build-allowed-tools'

/** PASO 99 (FRONTERA, lleva firma): libre gana SOLO WebSearch — del lado
 *  servidor, por el canal del modelo que la caja ya deja pasar (sonda verde
 *  dentro de allowedDomains:[]). Ni Bash, ni grafo, ni disco. Y 'lectura'
 *  queda EXACTA.
 *  PASO 137 (FRONTERA, firma de Jojo): el candado se ENSANCHA — trusted ahora
 *  DEGRADA al trabajo no confiable (web negada), y libre/cto conservan su
 *  WebSearch EXACTO pase lo que pase: son globales sin repo.
 *  PASO 142 (FRONTERA, firma de Jojo): el «diferido» de WebFetch se CIERRA —
 *  libre lo DENIEGA de verdad en la lista (SSRF), estructural y no por el muro
 *  de permiso. WebSearch intacta: el candado se ensancha, jamas se afloja. */
describe('el modo libre: WebSearch y nada mas', () => {
  it("buildAllowedTools('libre') es EXACTAMENTE ['WebSearch']", () => {
    expect(buildAllowedTools('libre', false, [])).toEqual(['WebSearch'])
  })

  it('LIBRE/CTO: WebSearch sagrada intacta, pero WebFetch DENEGADO (PASO 142)', () => {
    expect(buildDisallowedTools('libre', false)).toEqual(['Bash', 'WebFetch'])
    expect(buildDisallowedTools('libre', true)).toEqual(['Bash', 'WebFetch'])
    // El allow NO cambia: la web sagrada sigue siendo WebSearch, pase lo que pase.
    expect(buildAllowedTools('libre', false, [])).toEqual(['WebSearch'])
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
