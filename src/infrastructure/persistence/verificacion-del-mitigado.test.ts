import { beforeEach, describe, expect, it } from 'vitest'
import { createBench, PROJECT, SSRF, type Bench } from './finding-fixture'

let bench: Bench

const nacer = (): string => {
  bench.repo.syncFromScan(PROJECT, 's1', [SSRF], '2026-08-08T10:00:00Z', new Set())
  return bench.memoryOf(SSRF.title)?.id ?? ''
}

const fila = (id: string): { lifecycle: string; nota: string | null; quien: string | null } =>
  bench.db
    .prepare(
      'SELECT lifecycle, mitigated_note AS nota, extinguido_por AS quien FROM findings WHERE id = ?'
    )
    .get(id) as { lifecycle: string; nota: string | null; quien: string | null }

beforeEach(() => {
  bench = createBench()
})

describe('la re-verificacion escribe sobre una fila YA mitigada (ADR-087)', () => {
  it('extinguir un MITIGADO deja quien lo pidio, sin cambiar el motivo', () => {
    const id = nacer()
    bench.repo.markMitigated(id, 'ya lo arregle', '2026-09-01T10:00:00Z')

    bench.repo.markExtinct([id], '2026-09-12T10:00:00Z', 'juicio_obsoleto', 'operador')

    expect(fila(id).lifecycle).toBe('EXTINCT')
    expect(fila(id).quien).toBe('operador')
  })

  it('EL AVISO LLEGA: anotarMitigado escribe donde markMitigated no podia', () => {
    // `markMitigated` exige venir de ACTIVE, asi que sobre una fila ya mitigada
    // no cambiaba nada y el operador se quedaba sin saber que su fix no valio.
    const id = nacer()
    bench.repo.markMitigated(id, 'ya lo arregle', '2026-09-01T10:00:00Z')

    expect(bench.repo.markMitigated(id, 'el aviso por la via vieja', '2026-09-12T10:00:00Z')).toBe(false) // prettier-ignore
    expect(fila(id).nota).toBe('ya lo arregle')

    expect(bench.repo.anotarMitigado(id, 'el marcador no esta')).toBe(true)
    expect(fila(id).nota).toBe('el marcador no esta')
    expect(fila(id).lifecycle).toBe('MITIGATED')
  })

  it('y no toca lo que ya se extinguio: avisar de un muerto no significa nada', () => {
    const id = nacer()
    bench.repo.markExtinct([id], '2026-09-12T10:00:00Z', 'juicio_obsoleto', 'agente')

    expect(bench.repo.anotarMitigado(id, 'tarde')).toBe(false)
  })

  it('lo extinguido por la COLA queda como `agente`: quien pregunto se distingue', () => {
    const id = nacer()
    bench.repo.markExtinct([id], '2026-09-12T10:00:00Z', 'juicio_obsoleto', 'agente')

    expect(fila(id).quien).toBe('agente')
  })
})
