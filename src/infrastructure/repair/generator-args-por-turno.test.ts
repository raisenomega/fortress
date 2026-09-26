import { afterAll, describe, expect, it } from 'vitest'
import { GRAPH_SERVER } from '@domain/connectors/graph-mcp'
import { carpetaDePrueba, limpiarCarpetasDePrueba } from '../carpeta-de-prueba-fixture'
import { argsDeLectura, argsDelGenerador } from './generator-args'

afterAll(limpiarCarpetasDePrueba)

const DIR = '/datos/grafo-por-turno/turno-motor'
const mcpDe = (
  args: readonly string[]
): { mcpServers: Record<string, { env?: Record<string, string> }> } =>
  JSON.parse(args[args.indexOf('--mcp-config') + 1]) as never

describe('el GRAPH propio del motor lleva la misma palanca (ADR-095 enmienda, camino 2)', () => {
  it('el generador (C3) lanza su grafo con CBM_CACHE_DIR al directorio del turno', () => {
    const args = argsDelGenerador('p', carpetaDePrueba('gen-'), DIR)
    expect(args.ok).toBe(true)
    if (args.ok)
      expect(mcpDe(args.value).mcpServers[GRAPH_SERVER].env).toEqual({ CBM_CACHE_DIR: DIR })
  })

  it('los que solo leen (analista, critico, OMEGA) tambien', () => {
    const args = argsDeLectura('p', carpetaDePrueba('lec-'), DIR)
    expect(args.ok).toBe(true)
    if (args.ok) {
      expect(mcpDe(args.value).mcpServers[GRAPH_SERVER].env).toEqual({ CBM_CACHE_DIR: DIR })
      expect(args.value).toContain('--strict-mcp-config')
    }
  })
})
