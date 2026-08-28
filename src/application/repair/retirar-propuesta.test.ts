import { describe, expect, it } from 'vitest'
import { banco, enEstado } from './retirar-propuesta-fixture'
import { retirarPropuesta } from './retirar-propuesta'

const MOTIVO = 'el veredicto quedo VETADO y la firma rebota'

describe('el operador retira una propuesta viva', () => {
  it('la caduca, y lo asienta en su libro y en el de la vida', async () => {
    const b = banco(enEstado('OMEGA'))

    expect(await retirarPropuesta(b.context, 'p1', MOTIVO)).toEqual({ ok: true, value: null })
    expect(b.parches).toEqual([expect.objectContaining({ state: 'CADUCADO' })])
    expect(b.eventos).toHaveLength(1)
    expect(b.asientos).toHaveLength(1)
  })

  it('el asiento lleva el MOTIVO, no solo la palabra retirada', async () => {
    const b = banco(enEstado('OMEGA'))
    await retirarPropuesta(b.context, 'p1', MOTIVO)

    expect(b.asientos[0].evidence).toContain(MOTIVO)
    expect(b.eventos[0].reason).toContain('retirada por el operador')
    expect(b.eventos[0].toState).toBe('CADUCADO')
  })

  it('HUERFANA: sin proyecto ni hallazgo vivos se retira igual', async () => {
    // 752a50b8 lleva desde el 14 de agosto en ANALIZADO con su proyecto borrado.
    const b = banco(enEstado('ANALIZADO'))

    expect((await retirarPropuesta(b.context, 'p1')).ok).toBe(true)
    expect(b.parches).toEqual([expect.objectContaining({ state: 'CADUCADO' })])
  })
})

describe('lo que no se retira', () => {
  it('una ya terminal: error, y NADA escrito', async () => {
    for (const state of ['MERGEADO', 'RECHAZADO', 'CADUCADO'] as const) {
      const b = banco(enEstado(state))
      expect((await retirarPropuesta(b.context, 'p1')).ok).toBe(false)
      expect([b.parches, b.eventos, b.asientos]).toEqual([[], [], []])
    }
  })

  it('una que ya no existe', async () => {
    expect((await retirarPropuesta(banco(null).context, 'nope')).ok).toBe(false)
  })
})
