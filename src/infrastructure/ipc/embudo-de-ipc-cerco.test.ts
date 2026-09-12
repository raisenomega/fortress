import { describe, expect, it } from 'vitest'
import { bancoDeIpc, revientaEn, PROYECTO, RUTA_DEL_CLIENTE } from './embudo-de-ipc-fixture'

describe('que se lleva un fallo de IPC de sus argumentos: nada', () => {
  it('SEGURO POR CONSTRUCCION: la nota lleva el canal, ni el message ni los args', async () => {
    const b = bancoDeIpc()
    revientaEn(b, 'scan:run')

    await expect(b.invocar('scan:run', PROYECTO, RUTA_DEL_CLIENTE)).rejects.toThrow()
    const { note } = b.notas[0].nota
    expect(note).toBe('FORTRESS rompio en el canal scan:run: Error')
    expect(note).not.toContain(RUTA_DEL_CLIENTE)
    expect(note).not.toContain('/media/')
    expect(note).not.toContain(PROYECTO)
    // Y el error entero, con su message, SI va al log local del operador.
    expect((b.log[0].error as Error).message).toContain(RUTA_DEL_CLIENTE)
  })

  it('y un canal con forma rara cae al centinela en vez de viajar', async () => {
    // Hoy los 110 registros pasan una constante de `IPC`, pero eso es una
    // auditoria de 110 sitios y no un contrato: basta un canal interpolado.
    const b = bancoDeIpc()
    const raro = `proyecto:${RUTA_DEL_CLIENTE}`
    revientaEn(b, raro)

    await expect(b.invocar(raro)).rejects.toThrow()
    expect(b.notas[0].nota.note).toBe('FORTRESS rompio en el canal desconocido: Error')
  })
})
