import { beforeEach, describe, expect, it } from 'vitest'
import { createBench, PROJECT, SSRF, API_KEY, type Bench } from './finding-fixture'

let bench: Bench

const nacer = (): void => {
  bench.repo.syncFromScan(PROJECT, 's1', [SSRF, API_KEY], '2026-08-08T10:00:00Z', new Set())
}
const idDe = (titulo: string): string => bench.memoryOf(titulo)?.id ?? ''

beforeEach(() => {
  bench = createBench()
})

describe('la historia del proyecto: solo lo cerrado (ADR-087)', () => {
  it('NO trae lo vivo: ni ACTIVE ni MITIGATED salen aqui', () => {
    // El tablero ensena lo que pide accion; esto, lo que ya no. Si un vivo se
    // colara, la historia diria que algo se cerro cuando sigue abierto.
    nacer()
    bench.repo.markMitigated(idDe(SSRF.title), 'ya lo arregle', '2026-09-01T10:00:00Z')

    expect(bench.repo.listHistoria(PROJECT)).toHaveLength(0)
  })

  it('trae lo EXTINCT con su motivo y su quien, que es lo que clasifica', () => {
    nacer()
    bench.repo.markExtinct([idDe(SSRF.title)], '2026-09-12T10:00:00Z', 'juicio_obsoleto', 'operador') // prettier-ignore

    const [fila] = bench.repo.listHistoria(PROJECT)
    expect(fila.extinctReason).toBe('juicio_obsoleto')
    expect(fila.extinguidoPor).toBe('operador')
    expect(fila.resolvedAt).toBe('2026-09-12T10:00:00Z')
    expect(fila.firstSeen).toBe('2026-08-08T10:00:00Z')
  })

  it('LO RECIENTE ARRIBA, y lo que no se resolvio al FINAL', () => {
    // Las fusiones no tienen fecha de cierre a proposito. Sin el `IS NULL`
    // delante del ORDER BY, SQLite las pondria arriba —NULL ordena bajo— y la
    // historia abriria con lo que menos se parece a una resolucion.
    nacer()
    const viejo = idDe(SSRF.title)
    const sinFecha = idDe(API_KEY.title)
    bench.repo.markExtinct([viejo], '2026-09-01T10:00:00Z', 'juicio_obsoleto', 'agente')
    bench.db
      .prepare(
        "UPDATE findings SET lifecycle='EXTINCT', resolved_at=NULL, extinct_reason=? WHERE id=?"
      ) // prettier-ignore
      .run('fusionada-con-otra', sinFecha)

    const orden = bench.repo.listHistoria(PROJECT).map((f) => f.resolvedAt)
    expect(orden).toEqual(['2026-09-01T10:00:00Z', null])
  })

  it('y no mezcla proyectos: la historia es de uno', () => {
    nacer()
    bench.repo.markExtinct([idDe(SSRF.title)], '2026-09-12T10:00:00Z', 'juicio_obsoleto', 'agente')

    expect(bench.repo.listHistoria('otro-proyecto')).toHaveLength(0)
  })
})
