import { describe, expect, it } from 'vitest'
import { envolverRegistroIpc } from './embudo-de-ipc'
import { bancoDeIpc, revientaEn, PROYECTO, RUTA_DEL_CLIENTE } from './embudo-de-ipc-fixture'

describe('de quien es un fallo de IPC', () => {
  it('CON projectId: viaja para que el sumidero resuelva el proyecto', async () => {
    // 35 de los 110 canales lo reciben. Con el, `vistaEn` vuelve a significar lo
    // que debe: un `scan:run` que revienta en tres clientes cuenta tres.
    const b = bancoDeIpc()
    revientaEn(b, 'scan:run')

    await expect(b.invocar('scan:run', PROYECTO)).rejects.toThrow()
    expect(b.notas[0].projectId).toBe(PROYECTO)
  })

  it('SIN projectId: no hay proyecto, y el sumidero caera a la instalacion', async () => {
    const b = bancoDeIpc()
    revientaEn(b, 'system:export-observations')

    await expect(b.invocar('system:export-observations')).rejects.toThrow()
    expect(b.notas[0].projectId).toBeUndefined()
  })

  it('y un primer argumento que NO es un id no sale de aqui: ni a la base', async () => {
    // Filtrar por forma de UUID acierta con los 35 sin una lista que mantener,
    // y garantiza que una ruta o una clave de ajustes no llegue a `findById`.
    const b = bancoDeIpc()
    revientaEn(b, 'settings:get')

    await expect(b.invocar('settings:get', RUTA_DEL_CLIENTE)).rejects.toThrow()
    expect(b.notas[0].projectId).toBeUndefined()
  })
})

describe('envolver dos veces no duplica la observacion', () => {
  it('la marca en la funcion envuelta corta la segunda vuelta', async () => {
    const b = bancoDeIpc()
    envolverRegistroIpc(b.registrador, b.sumidero)
    revientaEn(b, 'health:run')

    await expect(b.invocar('health:run')).rejects.toThrow()
    expect(b.notas).toHaveLength(1)
  })
})
