import { afterEach, describe, expect, it } from 'vitest'
import { stopScan } from './detener-escaneo'

const parados: string[] = []

/** El puente del preload, fingido: `api()` lee de `window.api`. */
function conPuente(): void {
  ;(globalThis as { window?: unknown }).window = {
    api: { scan: { stop: (id: string) => (parados.push(id), Promise.resolve(1)) } }
  }
}

afterEach(() => {
  parados.length = 0
  delete (globalThis as { window?: unknown }).window
})

describe('Detener consume el canal que 4b dejo abierto', () => {
  it('llama a scan.stop con el proyecto que se esta escaneando', async () => {
    conPuente()

    await stopScan('p1')

    expect(parados).toEqual(['p1'])
  })

  it('alcanza SOLO a lo suyo: el id viaja tal cual', async () => {
    conPuente()

    await stopScan('otro')

    expect(parados).toEqual(['otro'])
  })
})
