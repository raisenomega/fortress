import { describe, expect, it } from 'vitest'
import { envolverRegistroIpc } from './embudo-de-ipc'
import { bancoDeIpc } from './embudo-de-ipc-fixture'

const PROYECTO = '366bb6d4-1943-4e2e-8547-a6056611e341'

describe('el embudo de IPC observa sin interceptar (ADR-086, embudo 2)', () => {
  it('CAPTURA Y RELANZA: asienta la observacion Y el error sigue al renderer', async () => {
    // Si tragara el error, el renderer dejaria de recibir lo que recibia y el
    // embudo habria cambiado el comportamiento en vez de mirarlo.
    const b = bancoDeIpc()
    const original = new TypeError('algo se rompio')
    envolverRegistroIpc(b.registrador, b.sumidero)
    b.registrador.handle('scan:run', () => {
      throw original
    })

    await expect(b.invocar('scan:run', PROYECTO)).rejects.toBe(original)
    expect(b.notas).toHaveLength(1)
    expect(b.notas[0].nota.note).toBe('FORTRESS rompio en el canal scan:run: TypeError')
    expect(b.log[0].error).toBe(original)
  })

  it('EL AWAIT: una promesa RECHAZADA tambien se captura', async () => {
    // El fallo silencioso de este gesto. Solo 13 de los 110 callbacks son
    // `async`, pero muchos sincronos DEVUELVEN una promesa. Sin el `await`, el
    // `try` devuelve la promesa antes de que se rechace y estos —los fallos
    // asincronos, los mas comunes— se escapan enteros.
    const b = bancoDeIpc()
    envolverRegistroIpc(b.registrador, b.sumidero)
    b.registrador.handle('quality:run', () => Promise.reject(new RangeError('tarde')))

    await expect(b.invocar('quality:run')).rejects.toThrow('tarde')
    expect(b.notas[0].nota.note).toBe('FORTRESS rompio en el canal quality:run: RangeError')
  })
})
