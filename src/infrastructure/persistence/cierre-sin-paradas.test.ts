import { describe, expect, it } from 'vitest'
import { cerrarEscaneo } from '@application/scan/cerrar-escaneo'
import { SIN_CAMPANA } from '@domain/scan/modulos-del-cierre'
import { SCORE_PROVISIONAL } from '@domain/scan/scan-history-repository'
import type { MotivoCierre } from '@domain/scan/motivo-cierre'
import type { DetectedFinding } from '@domain/scan/detected-finding'
import type { Project } from '@domain/project/project'
import type { ScanRecord } from '@domain/scan/scan-record'
import { PROJECT, PROYECTO, SIN_FACTURA } from './cierre-partido-fixture'
import { abrirRecorrido, AT } from './paradas-fixture'

const NOTA_DE_AYER = 63

interface Cierre {
  readonly proyecto: Project | null
  readonly fila: ScanRecord
}

function cerrar(
  motivo: MotivoCierre,
  paradasHechas: number,
  reportados: readonly DetectedFinding[] = []
): Cierre {
  const r = abrirRecorrido()
  // El proyecto llega con la nota de un escaneo anterior: es lo que el tablero
  // pinta hoy, y lo que un escaneo que no vio nada no tiene derecho a mover.
  r.bench.context.projects.updateScan(PROYECTO, NOTA_DE_AYER, '2026-09-01T00:00:00.000Z')

  cerrarEscaneo(r.bench.context, PROJECT, { scanId: r.scanId, reportados, paradasHechas, paradasTotal: 3, ficherosCubiertos: 0, ficherosTotal: 2108, modulos: SIN_CAMPANA, motivo, at: AT, durationMs: 5400, transcurridoMs: 900_000, usage: SIN_FACTURA, tools: [], edits: [] }) // prettier-ignore

  const [fila] = r.bench.context.scans.listByProject(PROYECTO, 10)
  return { proyecto: r.bench.context.projects.findById(PROYECTO), fila }
}

describe('un escaneo que no completo NINGUNA parada no puntua al proyecto', () => {
  it('el tablero conserva la nota de ayer, no la cambia por un 100', () => {
    // El agujero: el estado decia ABORTADO pero el score se escribia igual, y con
    // cero auditado el expediente esta vacio — 100/100 «proyecto limpio».
    const { proyecto } = cerrar('fallo', 0)

    expect(proyecto?.fortressScore).toBe(NOTA_DE_AYER)
  })

  it('la fila del escaneo queda en el score PROVISIONAL, no en un 100 inventado', () => {
    expect(cerrar('fallo', 0).fila.score).toBe(SCORE_PROVISIONAL)
  })

  it('un escaneo parado por el operador sin ninguna parada tampoco puntua', () => {
    expect(cerrar('abortado', 0).proyecto?.fortressScore).toBe(NOTA_DE_AYER)
  })
})

describe('con una parada hecha SI puntua: lo auditado mas lo vivo es honesto', () => {
  it('un fallo a mitad escribe la nota del expediente', () => {
    const uno: DetectedFinding[] = [{ severity: 'HIGH', title: 'x', file: 'a.ts', line: 1 }]

    const { proyecto, fila } = cerrar('fallo', 1, uno)

    expect(proyecto?.fortressScore).toBe(92)
    expect(fila.score).toBe(92)
  })
})
