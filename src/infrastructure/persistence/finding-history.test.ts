import { beforeEach, describe, expect, it } from 'vitest'
import { API_KEY, createBench, PROJECT, SSRF, type Bench } from './finding-fixture'

let bench: Bench

beforeEach(() => {
  bench = createBench()
})

describe('memoria de hallazgos: la historia se preserva', () => {
  it('firstSeen NO se reescribe y lastSeen avanza', () => {
    bench.repo.syncFromScan(PROJECT, 's1', [SSRF], '2026-08-08T10:00:00Z')
    bench.repo.syncFromScan(PROJECT, 's2', [SSRF], '2026-08-11T10:00:00Z')

    expect(bench.memoryOf(SSRF.title)?.firstSeen).toBe('2026-08-08T10:00:00Z')
    expect(bench.memoryOf(SSRF.title)?.lastSeen).toBe('2026-08-11T10:00:00Z')
  })

  it('la redaccion cambia y sigue siendo la MISMA fila', () => {
    bench.repo.syncFromScan(PROJECT, 's1', [SSRF], '2026-08-08T10:00:00Z')
    const antes = bench.memoryOf(SSRF.title)?.id

    const otroTexto = { ...SSRF, title: 'SSRF: el filtro no valida la IP que resuelve el DNS' }
    bench.repo.syncFromScan(PROJECT, 's2', [otroTexto], '2026-08-09T10:00:00Z')

    expect(bench.rows()).toBe(1)
    expect(bench.memoryOf(otroTexto.title)?.id).toBe(antes)
  })

  it('un hallazgo nuevo de verdad entra con su propia fecha, sin heredar la ajena', () => {
    bench.repo.syncFromScan(PROJECT, 's1', [SSRF], '2026-08-08T10:00:00Z')
    bench.repo.syncFromScan(PROJECT, 's2', [SSRF, API_KEY], '2026-08-09T10:00:00Z')

    expect(bench.rows()).toBe(2)
    expect(bench.memoryOf(API_KEY.title)?.firstSeen).toBe('2026-08-09T10:00:00Z')
    expect(bench.memoryOf(SSRF.title)?.firstSeen).toBe('2026-08-08T10:00:00Z')
  })

  it('todo hallazgo nace ACTIVE y con su clave estable puesta', () => {
    bench.repo.syncFromScan(PROJECT, 's1', [SSRF], '2026-08-08T10:00:00Z')
    const memoria = bench.memoryOf(SSRF.title)

    expect(memoria?.lifecycle).toBe('ACTIVE')
    expect(memoria?.resolvedAt).toBeNull()
    expect(memoria?.identity).toContain('target-url.ts')
  })

  it('el descarte del operador es ORTOGONAL al ciclo de vida del problema', () => {
    bench.repo.syncFromScan(PROJECT, 's1', [SSRF], '2026-08-08T10:00:00Z')
    const id = bench.memoryOf(SSRF.title)?.id ?? ''

    expect(bench.repo.dismiss(id)).toBe(true)

    const memoria = bench.memoryOf(SSRF.title)
    expect(memoria?.status).toBe('false_positive') // decision del operador
    expect(memoria?.lifecycle).toBe('ACTIVE') // el problema sigue en el codigo
  })
})

describe('el precio de llevar la linea en la clave', () => {
  it('un defecto que se MUEVE de linea abre fila nueva: el precio de ADR-084', () => {
    // El coste declarado de meter la linea en la clave, escrito para que nadie
    // lo descubra por sorpresa. Se acepta porque la linea NO baila: medido
    // sobre el corpus, los 15 sitios con mismo fichero+tipo y lineas distintas
    // son defectos DISTINTOS —`awardPoints:47` y `deductPoints:57`, cuatro
    // secretos distintos del mismo `.env`—, y ninguno el mismo dos veces.
    bench.repo.syncFromScan(PROJECT, 's1', [SSRF], '2026-08-08T10:00:00Z')

    bench.repo.syncFromScan(PROJECT, 's2', [{ ...SSRF, line: 41 }], '2026-08-09T10:00:00Z')

    expect(bench.rows()).toBe(2)
  })
})
