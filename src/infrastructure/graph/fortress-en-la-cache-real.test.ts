import { describe, expect, it } from 'vitest'
import { GRAPH_SERVER } from '@domain/connectors/graph-mcp'
import { argsDeIndexar } from './index-graph'
import { verifyArgs } from './verify-graph'

const entrada = (args: readonly string[]): { env?: unknown } =>
  (JSON.parse(args[args.indexOf('--mcp-config') + 1]) as { mcpServers: Record<string, { env?: unknown }> }).mcpServers[GRAPH_SERVER] // prettier-ignore

describe('las acciones de FORTRESS sobre el grafo NO se aislan: escriben y leen la cache real (enmienda, casilla 3)', () => {
  it('instalar/indexar lanza el grafo sin CBM_CACHE_DIR: el indice de verdad va a la cache real', () => {
    expect(entrada(argsDeIndexar()).env).toBeUndefined()
  })

  it('verificar la conexion tampoco lleva CBM_CACHE_DIR', () => {
    expect(entrada(verifyArgs()).env).toBeUndefined()
  })
})
