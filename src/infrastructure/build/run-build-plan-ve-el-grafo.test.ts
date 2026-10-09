import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it, vi } from 'vitest'
import type { AppContext } from '@application/context'
import { claudeModeArg } from '@domain/settings/permission-mode'
import { buildAllowedTools, buildDisallowedTools } from '../claude-code/build-allowed-tools'
import { agenteQueRecuerda } from '@application/agente-que-recuerda'
import { runBuildPlan } from './run-build-plan'

const recuerda = vi.hoisted(() => ({ pedidos: [] as { permissionMode: string }[] }))

// Solo el agente: el resolutor del proyecto es el real.
vi.mock('./build-target', async (real) => ({
  ...(await real<object>()),
  agentFor: () => {
    const { agent, pedidos } = agenteQueRecuerda('el plan')
    recuerda.pedidos = pedidos
    return agent
  }
}))

const ctx = {
  projects: { findById: () => ({ id: 'p1', name: 'P', path: mkdtempSync(join(tmpdir(), 'plan-')), trusted: false }) } // prettier-ignore
} as unknown as AppContext

/**
 * BUG 2 repetido (ROADMAP #5, sub-pieza 2): el planner corria en `plan`, que
 * BLOQUEA todo el MCP. Su unica corrida en la base viva (2026-09-19) uso Bash
 * dos veces y el grafo cero.
 */
describe('el Plan de Construir ve el grafo', () => {
  it('corre en lectura, no en plan', async () => {
    await runBuildPlan(ctx, 'p1', 'una feature')

    expect(recuerda.pedidos[0]?.permissionMode).toBe('lectura')
    expect(claudeModeArg('lectura')).toBe('default')
  })

  it('y lo que cambia de verdad: el grafo responde, y Bash se le QUITA (plan lo regalaba)', () => {
    // Medido contra el codigo, no contra el mapa del #5, que decia lo contrario.
    expect(buildAllowedTools('lectura', false, []).some((t) => t.includes('codebase-memory'))).toBe(
      true
    )
    expect(buildDisallowedTools('lectura', true)).toEqual(['Bash'])
    expect(buildDisallowedTools('plan', true)).toEqual([])
  })
})
