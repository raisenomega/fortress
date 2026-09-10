import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { ScanChunk } from '@domain/scan/scan-chunk'

type Handler = (event: unknown, projectId: string) => unknown

const handlers = new Map<string, Handler>()
const enviados: ScanChunk[] = []

vi.mock('electron', () => ({
  ipcMain: { handle: (canal: string, fn: Handler): void => void handlers.set(canal, fn) }
}))
vi.mock('../persistence/app-context', () => ({ getAppContext: () => ({}) }))

const { IPC } = await import('./channels')
const { registerScanHandlers } = await import('./scan-handlers')
const { isCancelled, endRun } = await import('../run-control')

/** La ventana falsa: recoge lo que el main le manda por el canal de progreso. */
const event = {
  sender: {
    isDestroyed: () => false,
    send: (canal: string, chunk: ScanChunk): void => void (canal === IPC.scanProgress && enviados.push(chunk)) // prettier-ignore
  }
}

beforeEach(() => {
  enviados.length = 0
  endRun('p1')
  registerScanHandlers()
})

describe('el metadato de parada viaja FUERA del tachado', () => {
  it('el texto del agente se tacha: un secreto no llega a la pantalla', async () => {
    const { progresoDeEscaneo } = await import('./scan-progress')
    const progreso = progresoDeEscaneo(event as never, 'p1')

    progreso.texto('export ANTHROPIC_API_KEY=sk-ant-0123456789abcdefghij')

    expect(enviados[0].delta).not.toContain('sk-ant-0123456789abcdefghij')
  })

  it('la parada llega entera: son numeros del manifiesto, no salida del agente', async () => {
    const { progresoDeEscaneo } = await import('./scan-progress')
    const progreso = progresoDeEscaneo(event as never, 'p1')

    progreso.parada({ hecha: 4, total: 12, carpeta: 'apps/api' })

    expect(enviados[0].parada).toEqual({ hecha: 4, total: 12, carpeta: 'apps/api' })
    // Sin texto que tachar: el chunk de parada no lleva prosa.
    expect(enviados[0].delta).toBe('')
  })
})

describe('scanStop marca la cancelacion', () => {
  it('el canal existe y deja el proyecto cancelado', async () => {
    const parar = handlers.get(IPC.scanStop)
    expect(parar).toBeDefined()

    await parar?.(null, 'p1')

    // El recorrido lo lee en la frontera de la SIGUIENTE parada.
    expect(isCancelled('p1')).toBe(true)
  })

  it('no cancela a otro proyecto: Detener alcanza solo a lo suyo', async () => {
    await handlers.get(IPC.scanStop)?.(null, 'p1')

    expect(isCancelled('otro')).toBe(false)
  })
})
