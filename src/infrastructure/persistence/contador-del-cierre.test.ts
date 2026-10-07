import { describe, expect, it } from 'vitest'
import { recorrerParadas } from '@application/scan/recorrer-paradas'
import { SIN_SALIDAS } from '@application/scan/progreso-del-recorrido'
import type { DetectedFinding } from '@domain/scan/detected-finding'
import type { Scanner } from '@domain/scan/scanner'
import { ok } from '@domain/shared/result'
import { crearBench, PROJECT, PROYECTO, SIN_FACTURA, type Bench } from './cierre-partido-fixture'
import { CUATRO } from './recorrido-fixture'

/** Dos paradas bastan: el solape es entre paradas, no cuestion de cuantas. */
const DOS = { ...CUATRO, paradas: CUATRO.paradas.slice(0, 2), ficherosTotal: 3 }

const f = (file: string, line: number, tipo: string, severity = 'MEDIUM'): DetectedFinding =>
  ({ severity, title: `t ${file}:${line}`, file, line, tipo }) as DetectedFinding

/** El solape medido en 74af9562: la MISMA identidad en las dos paradas, y el
 *  MISMO defecto con la linea corrida (57 vs 42 alla; 10 vs 14 aqui). */
function escanerQueRepite(): Scanner {
  const porParada: DetectedFinding[][] = [
    [f('auth/login.ts', 7, 'rate-limit-ausente'), f('utils/fmt.ts', 10, 'secret-in-env')],
    [f('auth/login.ts', 7, 'rate-limit-ausente'), f('utils/fmt.ts', 14, 'secret-in-env')]
  ]
  return {
    isAvailable: () => true,
    precheck: () => null,
    scan: () => Promise.resolve(ok({ findings: porParada.shift() ?? [], durationMs: 1, usage: SIN_FACTURA, tools: [], edits: [], texto: '', notas: [] })) // prettier-ignore
  }
}

const filasDe = (bench: Bench, scanId: string): number =>
  (bench.db.prepare('SELECT COUNT(*) n FROM findings WHERE scan_id = ?').get(scanId) as { n: number }).n // prettier-ignore

describe('el contador del cierre no miente', () => {
  it('finding_count = filas reales del escaneo, no el crudo concatenado', async () => {
    const bench = crearBench()

    await recorrerParadas(bench.context, escanerQueRepite(), PROJECT, DOS, SIN_SALIDAS, { cancelado: () => false }) // prettier-ignore

    const fila = bench.context.scans.listByProject(PROYECTO, 1)[0]
    const filas = filasDe(bench, fila.id)
    // El crudo fueron 4 entradas; la identidad repetida garantiza menos filas.
    expect(filas).toBeLessThan(4)
    expect(fila.findingCount).toBe(filas)
  })

  it('candado: critical_count sigue siendo del EXPEDIENTE e incluye al ausente vivo', async () => {
    const bench = crearBench()
    // Un CRITICAL de un escaneo ANTERIOR que este recorrido no va a nombrar.
    const previo = bench.context.scans.abrir({ projectId: PROYECTO, startedAt: 't', paradasTotal: 1, ficherosTotal: null }) // prettier-ignore
    bench.context.findings.syncFromScan(PROYECTO, previo.id, [f('core/x.ts', 3, 'missing-trust-check', 'CRITICAL')], 't') // prettier-ignore

    await recorrerParadas(bench.context, escanerQueRepite(), PROJECT, DOS, SIN_SALIDAS, { cancelado: () => false }) // prettier-ignore

    const fila = bench.context.scans.listByProject(PROYECTO, 2).find((s) => s.id !== previo.id)
    if (fila === undefined) throw new Error('el recorrido no dejo fila')
    // El ausente vivo puntua en el expediente: diseno documentado, no bug.
    expect(fila.criticalCount).toBe(1)
    // Y el contador de hallazgos NO lo arrastra: cuenta lo de ESTE escaneo.
    expect(fila.findingCount).toBe(filasDe(bench, fila.id))
  })
})
