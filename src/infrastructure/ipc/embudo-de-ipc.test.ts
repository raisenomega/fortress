import { describe, expect, it } from 'vitest'
import { envolverRegistroIpc, esFrameDeConfianza, exigirOrigenPropio } from './embudo-de-ipc'
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

const PROPIA = { indexHtml: '/tmp/.mount_FcC9x/out/renderer/index.html', devUrl: undefined }
const llama = (url: string, parent: unknown = null): unknown => ({ senderFrame: { url, parent } })

describe('el control de origen: solo contesta la interfaz propia', () => {
  it('el frame principal del index empaquetado pasa, con ancla y espacios codificados', () => {
    expect(esFrameDeConfianza(llama(`file://${PROPIA.indexHtml}#/scan`), PROPIA)).toBe(true)
    const conEspacio = { ...PROPIA, indexHtml: '/home/a b/index.html' }
    expect(esFrameDeConfianza(llama('file:///home/a%20b/index.html'), conEspacio)).toBe(true)
  })

  it('un subframe, otro fichero, otra web o un frame destruido NO pasan', () => {
    expect(esFrameDeConfianza(llama(`file://${PROPIA.indexHtml}`, {}), PROPIA)).toBe(false)
    expect(esFrameDeConfianza(llama('file:///tmp/otro/index.html'), PROPIA)).toBe(false)
    expect(esFrameDeConfianza(llama('https://evil.example/'), PROPIA)).toBe(false)
    expect(esFrameDeConfianza({ senderFrame: null }, PROPIA)).toBe(false)
  })

  it('en dev manda el origen del dev server, no el file://', () => {
    const dev = { ...PROPIA, devUrl: 'http://localhost:5173' }
    expect(esFrameDeConfianza(llama('http://localhost:5173/#/x'), dev)).toBe(true)
    expect(esFrameDeConfianza(llama('http://localhost:5174/'), dev)).toBe(false)
  })

  it('por FUERA del embudo: el rechazo llega al renderer y no se asienta como fallo', async () => {
    const b = bancoDeIpc()
    exigirOrigenPropio(b.registrador, PROPIA)
    envolverRegistroIpc(b.registrador, b.sumidero)
    b.registrador.handle('settings:get', () => 'secreto')

    await expect(b.invocar('settings:get')).rejects.toThrow('rechazado')
    expect(b.notas).toHaveLength(0)
  })
})
