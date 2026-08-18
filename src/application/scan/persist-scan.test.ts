import { describe, expect, it } from 'vitest'
import type { Project } from '@domain/project/project'
import { fixture, type Guardado } from './persist-scan-fixture'
import { persistScan } from './persist-scan'

describe('persistScan', () => {
  it('puntua el expediente ACTIVE, no solo la corrida', async () => {
    const saved: Guardado = {}
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

  it('la fila del historico distingue la corrida del expediente que puntuo', async () => {
    const saved: Guardado = {}
    const project = { id: 'p1', path: '/tmp/p1', name: 'p1' } as Project

    await persistScan(fixture(saved), project, {
      findings: [{ severity: 'MEDIUM', title: 'nuevo', file: 'c.ts', line: 3 }],
      durationMs: 1,
      usage: { inputTokens: 0, outputTokens: 0, cacheReadTokens: 0, cacheCreationTokens: 0, costUsd: 0, numTurns: 0 }, // prettier-ignore
      tools: [],
      edits: []
    })

    // Uno reportado, dos puntuados (el nuevo + el HIGH que sigue vivo). Sin la
    // segunda cifra, "score 89 con 1 hallazgo" no se puede leer.
    expect(saved.fila?.findingCount).toBe(1)
    expect(saved.fila?.dossierCount).toBe(2)
  })
})
