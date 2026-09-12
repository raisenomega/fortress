import { describe, expect, it } from 'vitest'
import { err } from '@domain/shared/result'
import { envolverRegistroIpc } from './embudo-de-ipc'
import { bancoDeIpc } from './embudo-de-ipc-fixture'

describe('el embudo de IPC no toca lo que NO revienta', () => {
  it('EL err() NO SE CAPTURA: es un valor de retorno, no una excepcion', async () => {
    // 156 `err()` en el codigo son la app FUNCIONANDO —un proyecto duplicado,
    // una carpeta que falta—. No hace falta distinguirlos: un `return` no pasa
    // por un `catch`, asi que el embudo no puede verlos aunque quisiera.
    const b = bancoDeIpc()
    envolverRegistroIpc(b.registrador, b.sumidero)
    b.registrador.handle('projects:add', () => err('Ese proyecto ya esta en FORTRESS'))

    await expect(b.invocar('projects:add')).resolves.toEqual({
      ok: false,
      error: 'Ese proyecto ya esta en FORTRESS'
    })
    expect(b.notas).toHaveLength(0)
    expect(b.log).toHaveLength(0)
  })

  it('y el camino feliz pasa intacto', async () => {
    const b = bancoDeIpc()
    envolverRegistroIpc(b.registrador, b.sumidero)
    b.registrador.handle('scan:counts', () => ({ total: 7 }))

    await expect(b.invocar('scan:counts')).resolves.toEqual({ total: 7 })
    expect(b.notas).toHaveLength(0)
  })
})
