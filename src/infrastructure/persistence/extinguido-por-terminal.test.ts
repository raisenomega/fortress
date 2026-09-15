import { describe, expect, it } from 'vitest'
import { createBench, PROJECT, SSRF } from './finding-fixture'

describe("'terminal' cabe en extinguido_por sin migracion (ADR-088)", () => {
  it('un mitigado que extingue el Terminal lo deja escrito, y la Historia lo trae', () => {
    // La columna es TEXT libre desde ADR-087: el tercer autor no pide ALTER.
    const bench = createBench()
    bench.repo.syncFromScan(PROJECT, 's1', [SSRF], '2026-08-08T10:00:00Z', new Set())
    const id = bench.memoryOf(SSRF.title)?.id ?? ''
    bench.repo.markMitigated(id, 'arreglado por el Terminal', '2026-09-15T10:00:00Z')

    bench.repo.markExtinct([id], '2026-09-15T10:01:00Z', 'juicio_obsoleto', 'terminal')

    const [fila] = bench.repo.listHistoria(PROJECT)
    expect(fila.extinguidoPor).toBe('terminal')
    expect(fila.extinctReason).toBe('juicio_obsoleto')
  })
})
