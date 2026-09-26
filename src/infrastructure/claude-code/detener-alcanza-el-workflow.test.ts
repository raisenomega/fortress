import { mkdtempSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import { describe, expect, it, vi } from 'vitest'
import type { WorkflowDeps } from '@application/workflow/run-workflow'
import { EMPTY_CORPUS } from '@domain/project/corpus-descriptor'
import type { Project } from '@domain/project/project'
import { DEFAULT_BUDGET } from '@domain/settings/run-budget'
import { ok } from '@domain/shared/result'

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
const { killChildrenOf } = await import('./child-registry')
const { runStep } = await import('@application/workflow/run-step')

const proyecto = {
  id: 'p-wf',
  name: 'P',
  path: mkdtempSync(join(tmpdir(), 'wf-')),
  trusted: false
} as Project

/** El agente es el REAL: es el quien registra al hijo con el dueño que le llega. */
const deps = (): WorkflowDeps => ({
  codeAgent: createClaudeCodeAgent({ read: () => null } as never, DEFAULT_BUDGET, false),
  project: proyecto,
  corpus: EMPTY_CORPUS,
  mode: 'autonomo',
  onStep: () => {},
  onChunk: () => {},
  known: [],
  isCancelled: () => false
})

describe('Detener alcanza al paso de workflow en curso', () => {
  it('el proceso del paso se registra con su proyecto, y killChildrenOf lo mata', async () => {
    void runStep(deps(), 'code-reviewer', 'revisa el codigo', 'plan', () => ok([]))
    await new Promise((r) => process.nextTick(r)) // el agente prepara el grafo del turno antes de lanzar
    const hijo = lanzados.at(-1)

    try {
      // Sin el projectId en la peticion el hijo quedaba registrado SIN dueño, y
      // Detener (`cancelRun` -> `killChildrenOf`) pasaba de largo: el paso en
      // curso seguia vivo hasta el reloj o hasta cerrar la app.
      expect(killChildrenOf('p-wf')).toBe(1)
      expect(hijo?.killed).toEqual(['SIGTERM'])
    } finally {
      hijo?.cerrar()
    }
  })
})
