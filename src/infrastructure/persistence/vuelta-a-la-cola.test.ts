import { beforeEach, describe, expect, it } from 'vitest'
import { createBench, PROJECT, SSRF, type Bench } from './finding-fixture'

let bench: Bench

interface Fila {
  lifecycle: string
  status: string
  nota: string | null
  dictamen: string | null
  marcado: string | null
}

const fila = (id: string): Fila =>
  bench.db
    .prepare(
      `SELECT lifecycle, status, mitigated_note AS nota, verificacion_note AS dictamen,
       mitigated_at AS marcado FROM findings WHERE id = ?`
    )
    .get(id) as Fila

const mitigado = (): string => {
  bench.repo.syncFromScan(PROJECT, 's1', [SSRF], '2026-08-08T10:00:00Z', new Set())
  const id = bench.memoryOf(SSRF.title)?.id ?? ''
  bench.repo.markMitigated(id, 'ya lo arregle en 8bda921', '2026-09-01T10:00:00Z')
  return id
}

const DICTAMEN = 'verificado a peticion del operador: el problema SIGUE en el codigo'

beforeEach(() => {
  bench = createBench()
})

describe('el hallazgo desmentido vuelve a la cola (ADR-087)', () => {
  it('VUELVE A ACTIVE y abierto: el motor ya lo puede tomar', () => {
    const id = mitigado()

    expect(bench.repo.devolverALaCola(id, DICTAMEN)).toBe(true)

    expect(fila(id).lifecycle).toBe('ACTIVE')
    expect(fila(id).status).toBe('open')
    expect(bench.repo.countsByProject()[PROJECT]).toMatchObject({ MEDIUM: 1 })
  })

  it('LA RAZON SOBREVIVE: el analista costo dinero y el operador la necesita', () => {
    const id = mitigado()

    bench.repo.devolverALaCola(id, DICTAMEN)

    expect(fila(id).dictamen).toBe(DICTAMEN)
  })

  it('y la fila no se queda diciendo «mitigado» cuando ya no lo esta', () => {
    // Es la mentira que `extinct_reason` cuenta hoy al resucitar, y no se repite
    // aqui: la fila deja de estar mitigada, asi que sus dos campos se limpian.
    const id = mitigado()

    bench.repo.devolverALaCola(id, DICTAMEN)

    expect(fila(id).marcado).toBeNull()
    expect(fila(id).nota).toBeNull()
  })

  it('solo vale desde MITIGATED: no resucita un extinto ni toca un activo', () => {
    bench.repo.syncFromScan(PROJECT, 's1', [SSRF], '2026-08-08T10:00:00Z', new Set())
    const id = bench.memoryOf(SSRF.title)?.id ?? ''

    expect(bench.repo.devolverALaCola(id, DICTAMEN)).toBe(false)
    bench.repo.markExtinct([id], '2026-09-12T10:00:00Z', 'juicio_obsoleto', 'agente')
    expect(bench.repo.devolverALaCola(id, DICTAMEN)).toBe(false)
    expect(fila(id).lifecycle).toBe('EXTINCT')
  })
})
