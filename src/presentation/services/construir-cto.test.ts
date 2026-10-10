import { afterEach, describe, expect, it, vi } from 'vitest'
import { useConstruirStore } from '../stores/construir-store'
import { elegirHilo } from './barra-del-chat'
import { escribirUser, elPuerto } from './hilo-activo'
import { rigDelHilo } from './hilo-activo-rig'
import { sendCto } from './construir-cto'
import { submitConstruir } from './construir-service'

/** PASO 126: el envio CTO — despacha a SU canal y persiste con SU modo. */

const conApi = (build: Record<string, unknown>): void => {
  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: { api: { build, chat: { onChunk: () => () => {} } } }
  })
}

afterEach(() => {
  Reflect.deleteProperty(globalThis, 'window')
  useConstruirStore.setState({ messages: [], draft: null, input: '', busy: false, mode: 'libre' }) // prettier-ignore
})

describe('DESPACHA A CTO: submitConstruir en modo cto llama a SU canal', () => {
  it('va a build.cto CON el ancla del proyecto activo (Sello B.1)', async () => {
    rigDelHilo()
    const cto = vi.fn().mockResolvedValue({ ok: true, value: 'PASO armado' })
    const libre = vi.fn()
    const plan = vi.fn()
    conApi({ cto, libre, plan })
    useConstruirStore.setState({ mode: 'cto', input: 'mide la web', busy: false })
    submitConstruir('p1')
    await vi.waitFor(() => expect(cto).toHaveBeenCalledWith('mide la web', [], 'p1'))
    expect(libre).not.toHaveBeenCalled()
    expect(plan).not.toHaveBeenCalled()
  })

  it('sin proyecto activo el ancla viaja null: el CTO global de siempre', async () => {
    rigDelHilo()
    const cto = vi.fn().mockResolvedValue({ ok: true, value: 'PASO armado' })
    conApi({ cto })
    useConstruirStore.setState({ mode: 'cto', input: 'piensa libre', busy: false })
    submitConstruir('')
    await vi.waitFor(() => expect(cto).toHaveBeenCalledWith('piensa libre', [], null))
  })
})

describe('PERSISTENCIA CTO: la puerta de Fase 1, usada por el EMISOR real', () => {
  it('sendCto persiste el hilo modo=cto, la barra lo lista y reabre COMO CTO', async () => {
    const db = rigDelHilo()
    conApi({ cto: vi.fn().mockResolvedValue({ ok: true, value: 'PASO armado' }) })
    await sendCto('Mide el selector', null)
    await vi.waitFor(() =>
      expect(db.prepare('SELECT modo FROM chats').get()).toEqual({ modo: 'cto' })
    )
    const hilo = useConstruirStore.getState().hiloActivo
    expect((await elPuerto().listHilos(null)).map((h) => h.id)).toContain(hilo?.id)
    useConstruirStore.getState().setMode('libre') // nos vamos del modo...
    await elegirHilo(hilo!)
    expect(useConstruirStore.getState().mode).toBe('cto') // ...y el clic lo devuelve
  })

  it('un hilo libre sigue reabriendo EN libre (el clic no se volvio cto)', async () => {
    rigDelHilo()
    await escribirUser({ projectId: null, modo: 'libre' }, 'charla normal')
    const hilo = useConstruirStore.getState().hiloActivo
    useConstruirStore.getState().setMode('plan')
    await elegirHilo(hilo!)
    expect(useConstruirStore.getState().mode).toBe('libre')
  })
})
