import { describe, expect, it } from 'vitest'
import type { FindingMemory } from '@domain/project/finding-memory'
import type { Project } from '@domain/project/project'
import type { AppContext } from '../context'
import { persistScan } from './persist-scan'

/** Expediente minimo: un ausente-pero-vivo (archivo intacto) y un candidato a extincion. */
function memoria(): FindingMemory[] {
  const base = { line: 1, status: 'open' as const, lifecycle: 'ACTIVE' as const }
  const fechas = { firstSeen: '2026-08-08T10:00:00Z', lastSeen: '2026-08-08T10:00:00Z' }
  return [
    { ...base, ...fechas, id: 'f1', identity: 'HIGH|vivo.ts|sigue vivo', severity: 'HIGH', title: 'sigue vivo', file: 'vivo.ts', resolvedAt: null }, // prettier-ignore
    { ...base, ...fechas, id: 'f2', identity: 'HIGH|tocado.ts|arreglado', severity: 'HIGH', title: 'arreglado', file: 'tocado.ts', resolvedAt: null } // prettier-ignore
  ]
}

/** Contexto falso: git dice que SOLO tocado.ts cambio; captura lo persistido. */
function fixture(saved: { score?: number; extinct?: readonly string[] }): AppContext {
  return {
    fileHistory: { changedSince: (_p: string, file: string) => Promise.resolve(file === 'tocado.ts') }, // prettier-ignore
    findings: {
      listMemory: () => memoria(),
      syncFromScan: (): void => undefined,
      markExtinct: (ids: readonly string[]): void => void (saved.extinct = ids)
    },
    transaction: (fn: () => void): void => fn(),
    scans: { record: () => ({ id: 's1' }) },
    projects: { updateScan: (_id: string, score: number): void => void (saved.score = score) },
    runs: { record: (): void => undefined },
    activity: { recordMany: (): void => undefined },
    cognitionWriter: { writeScan: (): void => undefined }
  } as unknown as AppContext
}

describe('persistScan', () => {
  it('puntua el expediente ACTIVE, no solo la corrida', async () => {
    const saved: { score?: number; extinct?: readonly string[] } = {}
    const project = { id: 'p1', path: '/tmp/p1', name: 'p1' } as Project

    const summary = await persistScan(fixture(saved), project, {
      // La corrida reporta un MEDIUM nuevo; los dos HIGH de la memoria NO.
      findings: [{ severity: 'MEDIUM', title: 'nuevo', file: 'c.ts', line: 3 }],
      durationMs: 1,
      usage: { inputTokens: 0, outputTokens: 0, cacheReadTokens: 0, cacheCreationTokens: 0, costUsd: 0, numTurns: 0 }, // prettier-ignore
      tools: [],
      edits: []
    })

    // tocado.ts cambio -> f2 se extingue y NO cuenta. vivo.ts intacto -> f1
    // sigue vivo y SI cuenta aunque la corrida no lo nombre: 100 - 3 - 8 = 89.
    // Puntuar solo la corrida habria dicho 97 con un HIGH vivo en la base.
    expect(saved.extinct).toEqual(['f2'])
    expect(summary.score).toBe(89)
    expect(saved.score).toBe(89)
    expect(summary.counts.HIGH).toBe(1)
    expect(summary.counts.MEDIUM).toBe(1)
  })
})
