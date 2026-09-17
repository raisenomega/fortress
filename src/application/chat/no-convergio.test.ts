import { describe, expect, it } from 'vitest'
import { contexto, RESPUESTA, REVERTIDO } from './no-convergio-fixture'
import { trasElTurno } from './tras-el-turno'

/**
 * ADR-090 amplia la pieza 3 de ADR-088. Sin esto, un hallazgo que el Terminal
 * intento y no logro quedaba contado como `no-conservado`: verdad a medias que
 * no distingue «lo intento tres veces y el revisor lo veto» de «no se toco».
 */
describe('el tercer desenlace: no convergio', () => {
  it('lo deja en la FILA del hallazgo con la objecion del revisor', async () => {
    const { ctx, notas } = contexto()

    await trasElTurno(ctx, 'f1', REVERTIDO, RESPUESTA, { convergio: false, razon: 'sigue permitiendo inline', intentos: 3 }) // prettier-ignore

    expect(notas).toHaveLength(1)
    expect(notas[0]).toContain('no resuelto')
    expect(notas[0]).toContain('no convergio')
    expect(notas[0]).toContain('sigue permitiendo inline')
    expect(notas[0]).toContain('3 veces')
  })

  it('y en el HILO, diciendo que el codigo quedo como estaba', async () => {
    const { ctx, hilo } = contexto()

    await trasElTurno(ctx, 'f1', REVERTIDO, RESPUESTA, { convergio: false, razon: 'r', intentos: 2 }) // prettier-ignore

    expect(hilo).toHaveLength(1)
    expect(hilo[0]).toContain('NO se resolvio')
    expect(hilo[0]).toContain('quedo como estaba')
  })

  it('devuelve el motivo `no-convergio`, no `no-conservado`', async () => {
    const { ctx } = contexto()

    const sin = await trasElTurno(ctx, 'f1', REVERTIDO, RESPUESTA, { convergio: false, razon: 'r', intentos: 2 }) // prettier-ignore

    expect(sin?.motivo).toBe('no-convergio')
  })

  it('un turno que SI convergio no pasa por aqui: cierra como siempre', async () => {
    const { ctx, notas, hilo } = contexto()

    await trasElTurno(ctx, 'f1', REVERTIDO, RESPUESTA, { convergio: true, razon: null, intentos: 1 }) // prettier-ignore

    expect(notas).toHaveLength(0)
    expect(hilo).toHaveLength(0)
  })
})
