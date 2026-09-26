import { mkdtempSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { CodeAgentRequest } from '@domain/chat/code-agent'
import { DEFAULT_BUDGET } from '@domain/settings/run-budget'

/** Los procesos que lanza el agente, de mentira: registran las señales. */
const { lanzados } = vi.hoisted(() => ({
  lanzados: [] as Array<{ killed: string[]; cerrar: () => void }>
}))

vi.mock('child_process', async (original) => {
  const { hijoFalso } = await import('./hijo-falso-fixture')
  const real = await original<typeof import('child_process')>()
  const spawn = (): unknown => {
    const hijo = hijoFalso()
    lanzados.push(hijo)
    return hijo
  }
  return { ...real, spawn }
})

const { createClaudeCodeAgent } = await import('./claude-code-agent')
const { SIN_TECHO, TECHO_POR_DEFECTO } = await import('./run-claude-process')

const UNA_HORA = 60 * 60 * 1000
const CLAVES = { read: () => null } as never

const peticion: CodeAgentRequest = {
  projectPath: mkdtempSync(join(tmpdir(), 'reloj-')),
  projectId: 'p-reloj',
  prompt: 'x',
  permissionMode: 'plan',
  agentId: null,
  trusted: false
}

beforeEach(() => vi.useFakeTimers())
afterEach(() => vi.useRealTimers())
const alSiguienteTick = (): Promise<void> => new Promise((r) => process.nextTick(r))

describe('el reloj lo decide quien crea el agente, y el agente lo cumple', () => {
  it('Build, Genesis, borradores y episodios no piden nada: SIGTERM a los 15 minutos', async () => {
    void createClaudeCodeAgent(CLAVES, DEFAULT_BUDGET, false).run(peticion, () => undefined)
    await alSiguienteTick() // el agente prepara el grafo del turno antes de lanzar
    const hijo = lanzados.at(-1)

    vi.advanceTimersByTime(TECHO_POR_DEFECTO + 1)

    expect(hijo?.killed).toEqual(['SIGTERM'])
    hijo?.cerrar()
  })

  it('escaneo y Terminal piden SIN_TECHO: pasada una HORA no les llega nada', async () => {
    const agente = createClaudeCodeAgent(CLAVES, DEFAULT_BUDGET, false, null, {}, SIN_TECHO)
    void agente.run(peticion, () => undefined)
    await alSiguienteTick()
    const hijo = lanzados.at(-1)

    vi.advanceTimersByTime(UNA_HORA)

    expect(hijo?.killed).toEqual([])
    hijo?.cerrar()
  })
})
