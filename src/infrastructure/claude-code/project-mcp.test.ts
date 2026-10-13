import { GRAPH_BIN } from '@domain/connectors/graph-mcp'
import { mkdtempSync, writeFileSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import { describe, expect, it } from 'vitest'
import { readProjectMcpServers } from './project-mcp'

const repoCon = (contenido: string): string => {
  const repo = mkdtempSync(join(tmpdir(), 'fcc-mcp-'))
  writeFileSync(join(repo, '.mcp.json'), contenido)
  return repo
}

const conServidores = (servers: Record<string, unknown>): string =>
  repoCon(JSON.stringify({ mcpServers: servers }))

describe('la forma cerrada: solo viaja lo que cuadra', () => {
  it('el caso legitimo del docblock viaja intacto: stdio con command, args y env', () => {
    const env = { CBM_CACHE_DIR: '/tmp/cache' }
    const entrada = { type: 'stdio', command: GRAPH_BIN, args: ['--db', 'graph.db'], env }
    const repo = conServidores({ 'codebase-memory': entrada })
    expect(readProjectMcpServers(repo)).toEqual({ 'codebase-memory': entrada })
  })

  it('sin `type` es stdio (los claude mcp add viejos) y los campos extra NO viajan', () => {
    const repo = conServidores({ g: { command: GRAPH_BIN, sorpresa: { x: 1 } } })
    const acotado = { type: 'stdio', command: GRAPH_BIN, args: [] }
    expect(readProjectMcpServers(repo)).toEqual({ g: acotado })
  })

  it('command no cadena, args con no-cadenas, tipo desconocido o no-objeto: fuera', () => {
    const repo = conServidores({
      a: { command: ['sh'] },
      b: { command: GRAPH_BIN, args: ['ok', 7] },
      c: { type: 'raro', command: GRAPH_BIN },
      d: 'ni siquiera objeto'
    })
    expect(readProjectMcpServers(repo)).toBeNull()
  })

  it('stdio fuera de la lista cerrada (red sin anti-SSRF): fuera, aunque cuadre la forma', () => {
    const repo = conServidores({
      sh: { command: 'sh', args: ['-c', 'curl http://169.254.169.254'] },
      ruta: { command: `/tmp/${GRAPH_BIN}` },
      npx: { command: 'npx', args: ['-y', 'algo-mcp'] }
    })
    expect(readProjectMcpServers(repo)).toBeNull()
  })

  it('env proyectado a la lista cerrada de claves y a cadena-cadena: lo demas se cae', () => {
    const env = { CBM_CACHE_DIR: '/c', NODE_OPTIONS: '-r x', HTTPS_PROXY: 'http://p', MAL: ['no'] }
    const repo = conServidores({ s: { command: GRAPH_BIN, env } })
    const acotado = { type: 'stdio', command: GRAPH_BIN, args: [], env: { CBM_CACHE_DIR: '/c' } }
    expect(readProjectMcpServers(repo)).toEqual({ s: acotado })
  })

  it('http solo con su url, como los conectores del operador', () => {
    const repo = conServidores({ h: { type: 'http', url: 'https://mcp', headers: { a: 'b' } } })
    expect(readProjectMcpServers(repo)).toEqual({ h: { type: 'http', url: 'https://mcp' } })
  })
})

describe('el contrato de siempre y el tope', () => {
  it('null sin archivo o con JSON roto', () => {
    expect(readProjectMcpServers(mkdtempSync(join(tmpdir(), 'fcc-vacio-')))).toBeNull()
    expect(readProjectMcpServers(repoCon('{ roto'))).toBeNull()
  })

  it('un .mcp.json desmedido no acaba en --mcp-config', () => {
    const repo = conServidores({ s: { command: GRAPH_BIN, args: ['y'.repeat(70 * 1024)] } })
    expect(readProjectMcpServers(repo)).toBeNull()
  })
})
