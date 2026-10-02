import { afterEach, describe, expect, it, vi } from 'vitest'
import { banco, COMPLETO, correr, libro, PARCIAL, vueltas } from './con-lazo-fixture'

afterEach(() => void vi.restoreAllMocks())

describe('conLazo: el camino rapido no paga nada', () => {
  it('un COMPLETO no lee el libro ni da vueltas', async () => {
    const list = vi.fn()
    const ctx = { eventLog: { list }, runs: { costUsdOf: vi.fn() } } as never
    const r = await correr(ctx, COMPLETO, 'ses-1')

    expect(r.ok && r.value).toMatchObject({ vueltas: 0, parada: 'completo' })
    expect(list).not.toHaveBeenCalled()
  })
})

describe('conLazo: un PARCIAL da otra vuelta', () => {
  it('la da, y el COMPLETO de la vuelta 2 cierra el lazo', async () => {
    const { generador } = vueltas([COMPLETO])
    const r = await correr(banco(libro(['h1'])), PARCIAL, 'ses-1')

    expect(r.ok && r.value).toMatchObject({ vueltas: 1, parada: 'completo' })
    expect(generador).toHaveBeenCalledTimes(1)
    // La objecion del revisor viaja al generador, y su sesion con ella.
    expect(generador.mock.calls[0]?.[2]).toContain('falta la mitad')
    expect(generador.mock.calls[0]?.[3]).toBe('ses-1')
  })

  it('la sesion se RECAPTURA: --fork-session abre una nueva en cada vuelta', async () => {
    const { generador } = vueltas([COMPLETO])
    const r = await correr(banco(libro(['h1'])), PARCIAL, 'ses-1')

    // Entra con la de la primera corrida y sale con la que devolvio la vuelta:
    // reusar la primera dos veces reanudaria siempre el mismo punto.
    expect(generador.mock.calls[0]?.[3]).toBe('ses-1')
    expect(r.ok && r.value.sesion).toBe('ses-nueva')
  })
})

describe('conLazo: las dos paradas', () => {
  it('la huella repetida converge, y el PARCIAL es el DESENLACE', async () => {
    const { generador } = vueltas([])
    const r = await correr(banco(libro(['h1', 'h1'])), PARCIAL, 'ses-1')

    expect(r.ok && r.value).toMatchObject({ vueltas: 0, parada: 'convergio' })
    expect(generador).not.toHaveBeenCalled()
  })

  it('el tope para a las DOS corridas del generador, no a las dos extra', async () => {
    const { generador } = vueltas([])
    const r = await correr(banco(libro(['h1', 'h2'])), PARCIAL, 'ses-1')

    expect(r.ok && r.value).toMatchObject({ parada: 'tope-de-vueltas' })
    expect(generador).not.toHaveBeenCalled()
  })

  it('el tope en DOLARES para antes de empezar la vuelta', async () => {
    const r = await correr(banco(libro(['h1']), 4.9), PARCIAL, 'ses-1')
    expect(r.ok && r.value).toMatchObject({ parada: 'tope-de-dolares' })
  })

  it('sin sesion no se gira a ciegas', async () => {
    const r = await correr(banco(libro(['h1'])), PARCIAL, undefined)
    expect(r.ok && r.value).toMatchObject({ parada: 'sin-sesion' })
  })
})
