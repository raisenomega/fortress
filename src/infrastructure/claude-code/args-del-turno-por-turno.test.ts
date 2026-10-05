import { afterAll, describe, expect, it } from 'vitest'
import type { CodeAgentRequest } from '@domain/chat/code-agent'
import { GRAPH_SERVER } from '@domain/connectors/graph-mcp'
import { carpetaDePrueba, limpiarCarpetasDePrueba } from '../carpeta-de-prueba-fixture'
import { argsDelTurno } from './args-del-turno'

afterAll(limpiarCarpetasDePrueba)

const DIR = '/datos/grafo-por-turno/turno-terminal'

describe('el turno del agente (Terminal, escaner, genesis...) lanza su grafo aislado', () => {
  it('argsDelTurno pega --mcp-config con env CBM_CACHE_DIR al directorio del turno', () => {
    const request: CodeAgentRequest = { projectPath: carpetaDePrueba('turno-'), prompt: 'x', permissionMode: 'plan', agentId: null, model: 'sonnet', trusted: false } // prettier-ignore
    const args = argsDelTurno(request, {}, null, 3, DIR)
    expect(args.ok).toBe(true)
    if (!args.ok) return
    const cfg = JSON.parse(args.value.args[args.value.args.indexOf('--mcp-config') + 1]) as { mcpServers: Record<string, { env?: Record<string, string> }> } // prettier-ignore
    expect(cfg.mcpServers[GRAPH_SERVER].env).toEqual({ CBM_CACHE_DIR: DIR })
  })
})
