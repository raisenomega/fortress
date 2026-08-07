import { GRAPH_SERVER } from '@domain/connectors/graph-mcp'
import type { GraphVerify } from './graph-actions'

interface InitEvent {
  readonly type?: string
  readonly subtype?: string
  readonly mcp_servers?: ReadonlyArray<{ name: string; status: string }>
  readonly tools?: readonly string[]
}

const PREFIX = `mcp__${GRAPH_SERVER}__`

/**
 * Lee el evento `init` del stream-json de claude -p: dice que servidores MCP
 * conectaron y que herramientas quedaron expuestas. De ahi sale la verificacion
 * real del grafo, sin depender de que el modelo "diga" que las tiene.
 */
export function parseInitEvent(line: string): GraphVerify | null {
  let event: InitEvent
  try {
    event = JSON.parse(line) as InitEvent
  } catch {
    return null
  }
  if (event.type !== 'system' || event.subtype !== 'init') return null
  const server = (event.mcp_servers ?? []).find((entry) => entry.name === GRAPH_SERVER)
  const tools = (event.tools ?? [])
    .filter((tool) => tool.startsWith(PREFIX))
    .map((tool) => tool.slice(PREFIX.length))
  return { connected: server?.status === 'connected', tools }
}
