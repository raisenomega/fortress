import { beforeEach, describe, expect, it } from 'vitest'
import { APERTURA, CIERRE, crearBench, type Bench } from './scan-history-fixture'

let bench: Bench

beforeEach(() => {
  bench = crearBench()
})

describe('cerrar', () => {
  it('la MISMA fila pasa a CERRADO con los valores finales', () => {
    const { id } = bench.repo.abrir(APERTURA)

    expect(bench.repo.cerrar(id, CIERRE)).toBe(true)

    const cerrada = bench.releer()
    expect(cerrada.id).toBe(id)
    expect(cerrada.estado).toBe('CERRADO')
    expect(cerrada.score).toBe(41)
    expect(cerrada.findingCount).toBe(23)
    expect(cerrada.dossierCount).toBe(31)
    expect(cerrada.criticalCount).toBe(1)
    // Cerrar ACTUALIZA: el historico deja de ser append-only, pero no se
    // duplica. Una fila por escaneo, se abra y se cierre o nazca cerrada.
    expect(bench.filas()).toBe(1)
  })

  it('la cobertura declarada queda escrita: X de Y', () => {
    const { id } = bench.repo.abrir(APERTURA)

    bench.repo.cerrar(id, CIERRE)

    const cerrada = bench.releer()
    expect(cerrada.paradasHechas).toBe(12)
    expect(cerrada.ficherosCubiertos).toBe(2108)
    expect(cerrada.ficherosTotal).toBe(2108)
    expect(cerrada.motivoCierre).toBe('completo')
  })

  it('`at` pasa a ser la hora del cierre; `startedAt` conserva la del arranque', () => {
    const { id } = bench.repo.abrir(APERTURA)

    bench.repo.cerrar(id, CIERRE)

    expect(bench.releer().at).toBe(CIERRE.at)
    expect(bench.releer().startedAt).toBe(APERTURA.startedAt)
  })
})

describe('cerrar un recorrido que se corto', () => {
  it('se cierra ABORTADO, con la cobertura que alcanzo', () => {
    const { id } = bench.repo.abrir(APERTURA)

    // prettier-ignore
    bench.repo.cerrar(id, { ...CIERRE, estado: 'ABORTADO', paradasHechas: 8, ficherosCubiertos: 1400, motivoCierre: 'timeout' })

    const cortada = bench.releer()
    expect(cortada.estado).toBe('ABORTADO')
    expect(cortada.motivoCierre).toBe('timeout')
    // Ocho paradas guardadas siguen siendo ocho paradas auditadas: es la
    // diferencia con el todo-o-nada de hoy, donde cortarse deja cero.
    expect(cortada.paradasHechas).toBe(8)
    expect(cortada.ficherosCubiertos).toBe(1400)
    expect(cortada.ficherosTotal).toBe(2108)
  })

  it('cerrar una fila que no existe dice que no, en vez de fingir', () => {
    expect(bench.repo.cerrar('no-existe', CIERRE)).toBe(false)
  })
})
