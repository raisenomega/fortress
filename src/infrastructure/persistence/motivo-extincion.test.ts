import { beforeEach, describe, expect, it } from 'vitest'
import { createBench, PROJECT, SSRF, type Bench } from './finding-fixture'

let bench: Bench

beforeEach(() => {
  bench = createBench()
})

describe('la extincion deja escrito POR QUE', () => {
  it('el MOTIVO se guarda con la fila: una muerte sin motivo no se audita', () => {
    // Reconstruir por que murio un hallazgo exigia cruzar la base con git
    // archivo por archivo. Asi se descubrio que dos murieron por un comentario.
    bench.repo.syncFromScan(PROJECT, 's1', [SSRF], '2026-08-08T10:00:00Z', new Set())
    const id = bench.memoryOf(SSRF.title)?.id ?? ''

    bench.repo.markExtinct([id], '2026-08-23T11:00:00Z', 'juicio_obsoleto', 'agente')
    const fila = bench.db
      .prepare('SELECT lifecycle, extinct_reason, extinguido_por FROM findings WHERE id = ?')
      .get(id) as { lifecycle: string; extinct_reason: string; extinguido_por: string }

    expect(fila.lifecycle).toBe('EXTINCT')
    expect(fila.extinct_reason).toBe('juicio_obsoleto')
    // Y QUIEN, que es otra pregunta: el motivo no cambia segun quien la haga.
    expect(fila.extinguido_por).toBe('agente')
  })

  it('extinguir dos veces no reescribe la fecha del cierre', () => {
    bench.repo.syncFromScan(PROJECT, 's1', [SSRF], '2026-08-08T10:00:00Z', new Set())
    const id = bench.memoryOf(SSRF.title)?.id ?? ''

    bench.repo.markExtinct([id], '2026-08-09T10:00:00Z', 'juicio_obsoleto', 'agente')
    bench.repo.markExtinct([id], '2026-08-20T10:00:00Z', 'juicio_obsoleto', 'agente')

    expect(bench.memoryOf(SSRF.title)?.resolvedAt).toBe('2026-08-09T10:00:00Z')
  })

  it('una lista vacia no toca nada', () => {
    bench.repo.syncFromScan(PROJECT, 's1', [SSRF], '2026-08-08T10:00:00Z', new Set())
    bench.repo.markExtinct([], '2026-08-09T10:00:00Z', 'juicio_obsoleto', 'agente')
    expect(bench.memoryOf(SSRF.title)?.lifecycle).toBe('ACTIVE')
  })
})
