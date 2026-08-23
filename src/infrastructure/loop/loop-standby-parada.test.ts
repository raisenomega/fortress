import { describe, expect, it } from 'vitest'
import { LoopCancelled, LoopTerminal, withStandby } from './loop-standby'

const SIGTERM = 'el proceso termino con codigo 143'

/** Hooks con una cancelacion que llega DURANTE la operacion, como en la vida. */
function hooks(cancelaAlFallar: boolean): Parameters<typeof withStandby>[1] {
  let cancelado = false
  return {
    isCancelled: () => cancelado,
    onStandby: () => {},
    waitOrCancel: () => Promise.resolve(),
    marcar: () => (cancelado = cancelaAlFallar)
  } as unknown as Parameters<typeof withStandby>[1] & { marcar: () => void }
}

describe('parar el loop no es que el loop se rompa', () => {
  it('cancelar a mitad de la operacion sale como LoopCancelled', async () => {
    // Parar mata al hijo; el hijo devuelve 143; clasificado a ciegas eso es una
    // averia del proveedor, y la sesion quedaba registrada como rota cuando lo
    // unico que paso es que el operador dijo basta.
    const h = hooks(true) as ReturnType<typeof hooks> & { marcar: () => void }
    const op = (): Promise<{ ok: false; error: string }> => {
      h.marcar()
      return Promise.resolve({ ok: false, error: SIGTERM })
    }

    await expect(withStandby(op, h)).rejects.toBeInstanceOf(LoopCancelled)
  })

  it('el mismo fallo SIN cancelacion sigue siendo terminal', async () => {
    const h = hooks(false)
    const op = (): Promise<{ ok: false; error: string }> =>
      Promise.resolve({ ok: false, error: SIGTERM })

    await expect(withStandby(op, h)).rejects.toBeInstanceOf(LoopTerminal)
  })
})
