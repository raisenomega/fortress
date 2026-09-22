import { describe, expect, it } from 'vitest'
import { medida } from '@domain/chat/medida-del-arbol'
import type { RedDeReversion } from '@domain/chat/red-de-reversion'
import { conRedDeReversion } from './con-red-de-reversion'
import { textOnly, type ReplyOutcome } from './reply-outcome'

/** Una red sin git: lo unico que se mira aqui es si el turno se QUEDO. */
const red = (verde = true, retirado = true): RedDeReversion => ({
  disponible: () => true,
  abrir: () => ({ conservar: () => retirado, revertir: () => retirado }),
  verificar: () => Promise.resolve(medida(verde ? 'verde' : 'rojo'))
})

const con =
  (over: Partial<ReplyOutcome> = {}): (() => Promise<ReplyOutcome>) =>
  () =>
    Promise.resolve({ ...textOnly('hecho'), edits: ['a.ts'], ...over })

describe('la red dice si el turno se CONSERVO (ADR-088: el cierre se fia de esto)', () => {
  it('verde con ediciones: conservado', async () => {
    expect((await conRedDeReversion(red(), '/p', true, con())).conservado).toBe(true)
  })

  it('el agente fallo o se detuvo: revertido, NO conservado', async () => {
    const t = await conRedDeReversion(red(), '/p', true, con({ failed: true }))
    expect(t.conservado).toBe(false)
  })

  it('el arbol no compila despues: revertido, NO conservado', async () => {
    expect((await conRedDeReversion(red(false), '/p', true, con())).conservado).toBe(false)
  })

  it('sin red —supervisado, plan o motor de texto—: NO conservado, nada lo garantiza', async () => {
    expect((await conRedDeReversion(red(), '/p', false, con())).conservado).toBe(false)
  })

  it('y REVERTIDO no es lo contrario: deshacer dice revertido, conservar no', async () => {
    expect((await conRedDeReversion(red(), '/p', true, con({ failed: true }))).revertido).toBe(true)
    expect((await conRedDeReversion(red(), '/p', true, con())).revertido).toBe(false)
  })

  it('sin red NADIE revirtio: revertido y conservado son false los dos', async () => {
    // El caso que la memoria por hallazgo necesita distinguir (ADR-088, Enm. 2).
    const t = await conRedDeReversion(red(), '/p', false, con({ failed: true }))
    expect([t.conservado, t.revertido]).toEqual([false, false])
  })

  it('el checkpoint quedo huerfano: las ediciones SI se quedaron, y lo dice el aviso', async () => {
    // `conservar()` devuelve si el commit se RETIRO, no si el arbol se quedo.
    const t = await conRedDeReversion(red(true, false), '/p', true, con())
    expect(t.conservado).toBe(true)
    expect(t.aviso).not.toBe('')
  })
})
