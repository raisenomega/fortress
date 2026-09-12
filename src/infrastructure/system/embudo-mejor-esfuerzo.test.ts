import { describe, expect, it } from 'vitest'
import { capturarFallo, instalarEmbudoDeArranque } from './embudo-de-arranque'
import type { SumideroDeFallos } from './embudo-de-arranque'
import { banco, emisorFalso } from './embudo-fixture'

/**
 * Lo que pasa cuando falla el registrar el fallo. No es un caso de laboratorio:
 * el fallo tipico del arranque ES que la base no abre, y asentar la observacion
 * abre la base. Un error no puede multiplicarse por el intento de anotarlo.
 */
describe('el embudo no empeora el fallo que esta anotando', () => {
  it('MEJOR ESFUERZO: si asentar lanza, el fallo original sigue en el log', () => {
    const b = banco(() => {
      throw new Error('la base no abre')
    })
    const e = emisorFalso()
    instalarEmbudoDeArranque(e.emisor, b.sumidero)

    expect(() => e.disparar('uncaughtException', new Error('el original'))).not.toThrow()
    expect(b.log).toHaveLength(1)
    expect((b.log[0].error as Error).message).toBe('el original')
  })

  it('y no se reentra: asentar que vuelve a caer aqui no abre un bucle', () => {
    const b = banco()
    let dentro = 0
    const suicida: SumideroDeFallos = {
      registrar: b.sumidero.registrar,
      asentar: () => {
        dentro += 1
        capturarFallo(suicida, 'una excepcion sin capturar', new Error('otra vez'))
      }
    }

    capturarFallo(suicida, 'el ensamblado de la app', new Error('la primera'))

    expect(dentro).toBe(1)
    expect(b.log).toHaveLength(1)
  })
})
