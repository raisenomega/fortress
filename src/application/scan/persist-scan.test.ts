import { describe, expect, it } from 'vitest'
import type { Project } from '@domain/project/project'
import { fixture, type Guardado } from './persist-scan-fixture'
import { persistScan } from './persist-scan'

describe('persistScan', () => {
  it('un escaneo NO extingue nada, ni siquiera con el archivo tocado', async () => {
    const saved: Guardado = {}
    const project = { id: 'p1', path: '/tmp/p1', name: 'p1' } as Project

    const summary = await persistScan(fixture(saved), project, {
      // La corrida reporta un MEDIUM nuevo; los dos HIGH de la memoria NO.
      findings: [{ severity: 'MEDIUM', title: 'nuevo', file: 'c.ts', line: 3 }],
      durationMs: 1,
      usage: { inputTokens: 0, outputTokens: 0, cacheReadTokens: 0, cacheCreationTokens: 0, costUsd: 0, numTurns: 0 }, // prettier-ignore
      tools: [],
      edits: [],
      texto: '', notas: []
    })

    // Los DOS HIGH siguen vivos y cuentan, aunque la corrida no los nombre y
    // aunque git diga que tocado.ts cambio: 100 - 3 - 8 - 8 = 81. Antes f2 se
    // extinguia por ese cambio de archivo, y asi murieron hallazgos reales.
    expect(saved.extinct).toBeUndefined()
    expect(summary.score).toBe(81)
    expect(saved.score).toBe(81)
    expect(summary.counts.HIGH).toBe(2)
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
      edits: [],
      texto: '', notas: []
    })

    // Uno reportado, TRES puntuados (el nuevo + los dos que siguen vivos). Sin
    // la segunda cifra, "score 81 con 1 hallazgo" no se puede leer.
    expect(saved.fila?.findingCount).toBe(1)
    expect(saved.fila?.dossierCount).toBe(3)
  })
})
