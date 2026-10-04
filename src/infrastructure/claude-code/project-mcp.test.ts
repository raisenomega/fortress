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
    const entrada = {
      type: 'stdio',
      command: 'codebase-memory-mcp',
      args: ['--db', 'graph.db'],
      env: { CBM_CACHE_DIR: '/tmp/cache' }
    }
    const repo = conServidores({ 'codebase-memory': entrada })
    expect(readProjectMcpServers(repo)).toEqual({ 'codebase-memory': entrada })
  })

  it('sin `type` es stdio (los claude mcp add viejos) y los campos extra NO viajan', () => {
    const repo = conServidores({ otro: { command: 'otro', sorpresa: { x: 1 } } })
    const acotado = { type: 'stdio', command: 'otro', args: [] }
    expect(readProjectMcpServers(repo)).toEqual({ otro: acotado })
  })

  it('command no cadena, args con no-cadenas, tipo desconocido o no-objeto: fuera', () => {
    const repo = conServidores({
      a: { command: ['sh'] },
      b: { command: 'x', args: ['ok', 7] },
      c: { type: 'raro', command: 'x' },
      d: 'ni siquiera objeto'
    })
    expect(readProjectMcpServers(repo)).toBeNull()
  })

  it('env proyectado a pares cadena-cadena: lo demas se cae', () => {
    const repo = conServidores({ s: { command: 'x', env: { OK: 'si', MAL: ['no'] } } })
    const acotado = { type: 'stdio', command: 'x', args: [], env: { OK: 'si' } }
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
    const repo = conServidores({ s: { command: 'x', args: ['y'.repeat(70 * 1024)] } })
    expect(readProjectMcpServers(repo)).toBeNull()
  })
})
