import { describe, expect, it } from 'vitest'
import { SIN_CAMPANA } from '@domain/scan/modulos-del-cierre'
import { cerrarEscaneo } from '@application/scan/cerrar-escaneo'
import { PROJECT, PROYECTO, SIN_FACTURA } from './cierre-partido-fixture'
import { abrirRecorrido, AT, PARADAS } from './paradas-fixture'

describe('el cierre puntua el recorrido COMPLETO, no la ultima parada', () => {
  it('el score sale de los cuatro hallazgos juntos', async () => {
    const recorrido = abrirRecorrido()
    await recorrido.guardarLasTres()

    const resumen = cerrarEscaneo(recorrido.bench.context, PROJECT, {
      scanId: recorrido.scanId,
      reportados: PARADAS.flat(),
      paradasHechas: 3,
      paradasTotal: 3,
      ficherosCubiertos: 2108,
      ficherosTotal: 2108,
      modulos: SIN_CAMPANA,
      motivo: 'completo',
      at: AT,
      durationMs: 5400,
      usage: SIN_FACTURA,
      tools: [],
      edits: []
    })

    // 100 - 25 - 8 - 3 - 1 = 63. Si se hubiera puntuado solo la ultima parada
    // —un CRITICAL— el numero seria 64 por el techo, y estaria mintiendo.
    expect(resumen.score).toBe(63)
    expect(resumen.counts.CRITICAL).toBe(1)
  })

  it('la fila queda CERRADA con su cobertura declarada', async () => {
    const recorrido = abrirRecorrido()
    await recorrido.guardarLasTres()

    recorrido.cerrar('completo')

    const [fila] = recorrido.bench.context.scans.listByProject(PROYECTO, 10)
    expect(fila.estado).toBe('CERRADO')
    expect(fila.findingCount).toBe(4)
    expect(fila.paradasHechas).toBe(3)
    expect(fila.ficherosCubiertos).toBe(2108)
    expect(fila.motivoCierre).toBe('completo')
    // Una fila de escaneo, no tres: las paradas no fabrican historial.
    expect(recorrido.bench.cuantas('scans')).toBe(1)
  })
})
