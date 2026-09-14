import { existsSync, mkdtempSync, readFileSync, symlinkSync, writeFileSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import { describe, expect, it } from 'vitest'
import { GRAPH_SERVER } from '@domain/connectors/graph-mcp'
import { writeProjectMcp } from './write-project-mcp'

const tmp = (p: string): string => mkdtempSync(join(tmpdir(), p))

const servidores = (file: string): Record<string, unknown> =>
  (JSON.parse(readFileSync(file, 'utf8')) as { mcpServers: Record<string, unknown> }).mcpServers

describe('el ataque real: un `.mcp.json` enlazado en el repo auditado', () => {
  it('el que apunta a un fichero FUERA no se sobrescribe', () => {
    const victima = join(tmp('fcc-victima-'), 'claves.txt')
    writeFileSync(victima, 'SECRETO DEL OPERADOR')
    const repo = tmp('fcc-repo-')
    symlinkSync(victima, join(repo, '.mcp.json'))

    writeProjectMcp(repo)

    expect(readFileSync(victima, 'utf8')).toBe('SECRETO DEL OPERADOR')
  })

  it('el COLGANTE hacia fuera no llega a crear su destino', () => {
    const destino = join(tmp('fcc-ajeno-'), 'creado.json')
    const repo = tmp('fcc-repo-')
    symlinkSync(destino, join(repo, '.mcp.json'))

    writeProjectMcp(repo)

    expect(existsSync(destino)).toBe(false)
  })

  it('el que apunta DENTRO del proyecto se escribe en su ruta real', () => {
    const repo = tmp('fcc-repo-')
    writeFileSync(join(repo, 'mcp.real.json'), '{}')
    symlinkSync(join(repo, 'mcp.real.json'), join(repo, '.mcp.json'))

    writeProjectMcp(repo)

    expect(servidores(join(repo, 'mcp.real.json'))[GRAPH_SERVER]).toBeDefined()
  })

  it('y en un repo normal se escribe, conservando los demas servidores', () => {
    const repo = tmp('fcc-repo-')
    const otro = { command: 'otro' }
    writeFileSync(join(repo, '.mcp.json'), JSON.stringify({ mcpServers: { otro } }))

    writeProjectMcp(repo)

    const escritos = servidores(join(repo, '.mcp.json'))
    expect(escritos.otro).toEqual(otro)
    expect(escritos[GRAPH_SERVER]).toBeDefined()
  })
})
