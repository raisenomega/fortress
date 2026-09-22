import { describe, expect, it } from 'vitest'
import { medida } from '@domain/chat/medida-del-arbol'
import { SIN_RED_NO_SE_EDITA, type RedDeReversion } from '@domain/chat/red-de-reversion'
import { conRedDeReversion } from './con-red-de-reversion'
import { textOnly } from './reply-outcome'

/** Una red que dijo que si y luego NO pudo montar el checkpoint: el caso que el
 *  `disponible` no puede prever —indice bloqueado, permisos, disco lleno—. */
const REVIENTA: RedDeReversion = {
  disponible: () => true,
  abrir: () => null,
  verificar: () => Promise.resolve(medida('verde'))
}

describe('si debia haber red y no la hay, NO se edita', () => {
  it('el turno ni se produce: el agente no llega a tocar el arbol', async () => {
    let producido = 0
    const producir = (): Promise<ReturnType<typeof textOnly>> => {
      producido++
      return Promise.resolve(textOnly('edite cosas'))
    }

    const turno = await conRedDeReversion(REVIENTA, '/repo', true, producir)

    // Lo que importa: NO se llamo al productor. Antes se llamaba igual y el
    // agente editaba el arbol vivo sin nada que lo deshiciera, en silencio.
    expect(producido).toBe(0)
    expect(turno.conservado).toBe(false)
  })

  it('y lo DICE, en vez de callarse', async () => {
    const turno = await conRedDeReversion(REVIENTA, '/repo', true, () =>
      Promise.resolve(textOnly('x'))
    )

    expect(turno.outcome.text).toBe(SIN_RED_NO_SE_EDITA)
    expect(turno.outcome.failed).toBe(true)
    expect(turno.outcome.text).toMatch(/user\.email/)
  })

  it('no se marca como REVERTIDO: no hubo nada que revertir', async () => {
    const turno = await conRedDeReversion(REVIENTA, '/repo', true, () =>
      Promise.resolve(textOnly('x'))
    )

    // La memoria del hallazgo distingue los dos casos (ADR-088, Enmienda 2).
    expect(turno.revertido).toBe(false)
  })

  it('SIN red pedida (supervisado), el turno corre como siempre', async () => {
    let producido = 0

    const turno = await conRedDeReversion(REVIENTA, '/repo', false, () => {
      producido++
      return Promise.resolve(textOnly('propuse, no edite'))
    })

    expect(producido).toBe(1)
    expect(turno.outcome.text).toBe('propuse, no edite')
  })
})
