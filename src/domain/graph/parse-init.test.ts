import { describe, expect, it } from 'vitest'
import { parseInitEvent } from './parse-init'

const init = (over: object): string => JSON.stringify({ type: 'system', subtype: 'init', ...over })

describe('parseInitEvent', () => {
  it('lee estado conectado y solo las tools del grafo', () => {
    const result = parseInitEvent(
      init({
        mcp_servers: [{ name: 'codebase-memory', status: 'connected' }],
        tools: ['mcp__codebase-memory__get_architecture', 'mcp__codebase-memory__trace_path', 'Read']
      })
    )
    expect(result).toEqual({ connected: true, tools: ['get_architecture', 'trace_path'] })
  })

  it('servidor failed -> no conecta', () => {
    const result = parseInitEvent(
      init({ mcp_servers: [{ name: 'codebase-memory', status: 'failed' }], tools: [] })
    )
    expect(result).toEqual({ connected: false, tools: [] })
  })

  it('lineas que no son el evento init o no son JSON -> null', () => {
    expect(parseInitEvent('{"type":"assistant"}')).toBeNull()
    expect(parseInitEvent('no es json')).toBeNull()
  })
})
