import { mkdtempSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import { describe, expect, it, vi } from 'vitest'
import type { CodeAgentRequest } from '@domain/chat/code-agent'
import { DEFAULT_BUDGET } from '@domain/settings/run-budget'

/** Los procesos que lanza el agente, de mentira: se pueden matar y cerrar. */
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
const { cancelRun, endRun, tryBeginRun } = await import('../run-control')

const peticion = (projectId: string): CodeAgentRequest => ({
  projectPath: mkdtempSync(join(tmpdir(), 'cancel-')),
  projectId,
  prompt: 'x',
  permissionMode: 'plan',
  agentId: null,
  trusted: false
})

describe('un hijo que nace DESPUES de la parada nace ya condenado', () => {
  it('con el proyecto cancelado, el proceso recien lanzado recibe SIGTERM al instante', async () => {
    // El caso medido el 2026-09-24: `cancelRun` mato a los hijos vivos (ninguno)
    // y el juez del alcance nacio un instante despues, huerfano hasta 2 minutos.
    const agente = createClaudeCodeAgent({ read: () => null } as never, DEFAULT_BUDGET, false)
    tryBeginRun('p-cancel')
    cancelRun('p-cancel')
    try {
      void agente.run(peticion('p-cancel'), () => {})
      await new Promise((r) => process.nextTick(r)) // el agente prepara el grafo del turno antes de lanzar
      expect(lanzados.at(-1)?.killed).toEqual(['SIGTERM'])
    } finally {
      lanzados.at(-1)?.cerrar()
      endRun('p-cancel')
    }
  })

  it('sin parada, el proceso recien lanzado sigue vivo', async () => {
    const agente = createClaudeCodeAgent({ read: () => null } as never, DEFAULT_BUDGET, false)
    tryBeginRun('p-vivo')
    try {
      void agente.run(peticion('p-vivo'), () => {})
      await new Promise((r) => process.nextTick(r))
      expect(lanzados.at(-1)?.killed).toEqual([])
    } finally {
      lanzados.at(-1)?.cerrar()
      endRun('p-vivo')
    }
  })
})
