import { describe, expect, it } from 'vitest'
import { runScan, type ScanDeps } from '@application/scan/run-scan'
import { SIN_SALIDAS } from '@application/scan/progreso-del-recorrido'
import type { Manifiesto } from '@domain/scan/manifiesto'
import { caminoSoldado } from './camino-soldado'
import { corrida, crearBench, PROJECT, PROYECTO } from './cierre-partido-fixture'
import { hallazgoDe, scannerFalso } from './recorrido-fixture'

/** Un proyecto de una sola carpeta: el escaneo monolitico de siempre. */
const UNA: Manifiesto = {
  paradas: [{ carpeta: 'src', ficheros: ['src/a.ts', 'src/b.ts'] }],
  ficherosTotal: 2
}

/** El manifiesto llega inyectado, como el escaner: aqui se elige la forma. */
const conManifiesto = (manifiesto: Manifiesto): ScanDeps => ({
  cancelado: () => false,
  medir: () => Promise.resolve(manifiesto)
})

describe('un proyecto de UNA parada da lo mismo que el escaneo monolitico', () => {
  it('misma fila que el camino soldado, con el mismo hallazgo', async () => {
    const soldado = crearBench()
    const partido = crearBench()
    const scanner = scannerFalso()

    // Los dos ven exactamente lo mismo: el hallazgo que el escaner falso emite
    // cuando no se le acota ninguna carpeta.
    await caminoSoldado(soldado.context, PROJECT, corrida([hallazgoDe('(todo)')]))
    await runScan(partido.context, scanner, PROYECTO, SIN_SALIDAS, conManifiesto(UNA))

    expect(partido.filaDelEscaneo()).toEqual(soldado.filaDelEscaneo())
    expect(partido.hallazgosGuardados()).toEqual(soldado.hallazgosGuardados())
    // El escaner de una parada se llama UNA vez y SIN rutas: el arbol entero.
    expect(scanner.pedidas).toEqual(['(todo)'])
  })

  it('la fila queda CERRADA y con UNA parada: el recorrido de 1 es el de hoy', async () => {
    const bench = crearBench()

    await runScan(bench.context, scannerFalso(), PROYECTO, SIN_SALIDAS, conManifiesto(UNA))

    const [fila] = bench.context.scans.listByProject(PROYECTO, 10)
    expect(fila.estado).toBe('CERRADO')
    expect(fila.motivoCierre).toBe('completo')
    // Una parada, la del commit 3: el camino monolitico ya pasa por abrir y
    // cerrar, asi que declara su recorrido de una.
    expect(fila.paradasTotal).toBe(1)
    expect(fila.paradasHechas).toBe(1)
  })

  it('un proyecto SIN fuente versionada tambien va por el camino de siempre', async () => {
    const bench = crearBench()
    const vacio: Manifiesto = { paradas: [], ficherosTotal: 0 }
    const scanner = scannerFalso()

    await runScan(bench.context, scanner, PROYECTO, SIN_SALIDAS, conManifiesto(vacio))

    expect(scanner.pedidas).toEqual(['(todo)'])
    expect(bench.cuantas('scans')).toBe(1)
  })
})
