import { describe, expect, it } from 'vitest'
import { CHECKPOINT_HUERFANO, REVERTIDO_POR_RED, type RedDeReversion } from '@domain/chat/red-de-reversion' // prettier-ignore
import { conRedDeReversion } from './con-red-de-reversion'
import { textOnly, type ReplyOutcome } from './reply-outcome'

/** Una red que apunta cada paso: lo que se prueba aqui es la DECISION, no git. */
function redFalsa(verde = true, retirado = true): { red: RedDeReversion; pasos: string[] } {
  const pasos: string[] = []
  const paso = (nombre: string): boolean => {
    pasos.push(nombre)
    return retirado
  }
  const red: RedDeReversion = {
    disponible: () => true,
    abrir: () => {
      pasos.push('abrir')
      return { conservar: () => paso('conservar'), revertir: () => paso('revertir') }
    },
    verificar: () => {
      pasos.push('verificar')
      return Promise.resolve(verde)
    }
  }
  return { red, pasos }
}

// prettier-ignore
const conEdiciones = (over: Partial<ReplyOutcome> = {}): ReplyOutcome => ({ ...textOnly('hecho'), edits: ['a.ts'], ...over })

describe('conRedDeReversion: la decision del turno', () => {
  it('exito con ediciones: verifica y conserva, sin aviso', async () => {
    const { red, pasos } = redFalsa()
    const t = await conRedDeReversion(red, '/p', true, () => Promise.resolve(conEdiciones()))
    expect(pasos).toEqual(['abrir', 'verificar', 'conservar'])
    expect(t.aviso).toBe('')
  })

  it('failed: revierte SIN verificar, y lo dice', async () => {
    const { red, pasos } = redFalsa()
    const t = await conRedDeReversion(red, '/p', true, () => Promise.resolve(conEdiciones({ failed: true }))) // prettier-ignore
    expect(pasos).toEqual(['abrir', 'revertir'])
    expect(t.aviso).toBe(REVERTIDO_POR_RED)
  })

  it('typecheck en rojo: revierte', async () => {
    const { red, pasos } = redFalsa(false)
    await conRedDeReversion(red, '/p', true, () => Promise.resolve(conEdiciones()))
    expect(pasos).toEqual(['abrir', 'verificar', 'revertir'])
  })

  it('sin ediciones no se verifica: un rojo heredado no es culpa de este turno', async () => {
    const { red, pasos } = redFalsa(false)
    await conRedDeReversion(red, '/p', true, () => Promise.resolve(textOnly('solo hable')))
    expect(pasos).toEqual(['abrir', 'conservar'])
  })

  it('inactiva (supervisado, o la API): ni se abre', async () => {
    const { red, pasos } = redFalsa()
    await conRedDeReversion(red, '/p', false, () => Promise.resolve(conEdiciones()))
    expect(pasos).toEqual([])
  })

  it('si producir lanza: revierte y deja pasar el error tal cual', async () => {
    const { red, pasos } = redFalsa()
    const boom = new Error('la base no escribe')
    await expect(conRedDeReversion(red, '/p', true, () => Promise.reject(boom))).rejects.toBe(boom)
    expect(pasos).toEqual(['abrir', 'revertir'])
  })

  it('checkpoint huerfano: se dice, no se calla', async () => {
    const { red } = redFalsa(true, false)
    const t = await conRedDeReversion(red, '/p', true, () => Promise.resolve(conEdiciones()))
    expect(t.aviso).toBe(CHECKPOINT_HUERFANO)
  })
})
