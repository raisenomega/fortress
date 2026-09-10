import { beforeEach, describe, expect, it } from 'vitest'
import { PROYECTO } from './cierre-partido-fixture'
import { abrirRecorrido, PARADAS, type Recorrido } from './paradas-fixture'

let recorrido: Recorrido

beforeEach(() => {
  recorrido = abrirRecorrido()
})

describe('los hallazgos se ACUMULAN parada a parada', () => {
  it('cada parada suma la suya sin borrar las anteriores', async () => {
    await recorrido.guardar(PARADAS[0])
    expect(recorrido.filas()).toBe(1)

    await recorrido.guardar(PARADAS[1])
    expect(recorrido.filas()).toBe(3)

    await recorrido.guardar(PARADAS[2])
    expect(recorrido.filas()).toBe(4)
  })

  it('guardar NO toca la fila del escaneo: sigue ABIERTA y sin nota', async () => {
    await recorrido.guardarLasTres()

    const [fila] = recorrido.bench.context.scans.listByProject(PROYECTO, 10)
    expect(fila.estado).toBe('ABIERTO')
    expect(fila.score).toBe(0)
    expect(recorrido.filas()).toBe(4)
  })

  it('repetir una parada no duplica: es upsert por identity', async () => {
    await recorrido.guardarLasTres()
    await recorrido.guardarLasTres()

    expect(recorrido.filas()).toBe(4)
  })
})
