import { existsSync, mkdtempSync, readdirSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterAll, describe, expect, it, vi } from 'vitest'
import type { CodeAgentRequest } from '@domain/chat/code-agent'
import { GRAPH_SERVER } from '@domain/connectors/graph-mcp'
import { DEFAULT_BUDGET } from '@domain/settings/run-budget'

/** Los procesos que lanza el agente, de mentira, CON los args con que se lanzaron. */
const { lanzados } = vi.hoisted(() => ({
  lanzados: [] as Array<{ args: readonly string[]; cerrar: () => void }>
}))

vi.mock('child_process', async (original) => {
  const { hijoFalso } = await import('./hijo-falso-fixture')
  const real = await original<typeof import('child_process')>()
  const spawn = (_bin: string, args: readonly string[]): unknown => {
    const hijo = hijoFalso()
    lanzados.push({ args, cerrar: hijo.cerrar })
    return hijo
  }
  return { ...real, spawn }
})

const { createClaudeCodeAgent } = await import('./claude-code-agent')
const { fijarRaizDeGrafosDeTurno } = await import('../graph/raiz-de-grafos-de-turno')

const raiz = fijarRaizDeGrafosDeTurno(mkdtempSync(join(tmpdir(), 'agente-grafo-')))
afterAll(() => rmSync(join(raiz, '..'), { recursive: true, force: true }))

const peticion = (): CodeAgentRequest => ({ projectPath: mkdtempSync(join(tmpdir(), 'proy-')), prompt: 'x', permissionMode: 'plan', agentId: null, model: 'sonnet', trusted: false }) // prettier-ignore
const tick = (): Promise<void> => new Promise((r) => process.nextTick(r))

describe('el agente prepara el grafo del turno antes de lanzar y lo libera al cerrar', () => {
  it('el hijo se lanza con CBM_CACHE_DIR apuntando a un directorio bajo la raiz, que muere con el proceso', async () => {
    const agente = createClaudeCodeAgent({ read: () => null } as never, DEFAULT_BUDGET, false)
    const turno = agente.run(peticion(), () => undefined)
    await tick()
    const lanzado = lanzados.at(-1)
    expect(lanzado).toBeDefined()
    const cfg = JSON.parse(lanzado!.args[lanzado!.args.indexOf('--mcp-config') + 1]) as { mcpServers: Record<string, { env?: Record<string, string> }> } // prettier-ignore
    const dir = cfg.mcpServers[GRAPH_SERVER].env?.CBM_CACHE_DIR
    expect(dir?.startsWith(raiz)).toBe(true)
    expect(existsSync(dir!)).toBe(true)
    expect(readdirSync(raiz)).toHaveLength(1)

    lanzado!.cerrar()
    await turno
    expect(existsSync(dir!)).toBe(false)
    expect(readdirSync(raiz)).toEqual([])
  })
})
