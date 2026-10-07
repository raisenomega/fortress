import { describe, expect, it } from 'vitest'
import { bloquesIlegibles } from './bloques-ilegibles'

const bloque = (json: string): string => '```json\n' + json + '\n```'

describe('el detector de bloques que no re-parsean', () => {
  it('nombra el roto por su indice y deja en paz a los sanos', () => {
    const texto = `a\n${bloque('{"ok":1}')}\nb\n${bloque('{"roto": sin cerrar')}\nc`
    expect(bloquesIlegibles(texto)).toEqual([2])
  })

  it('un crudo sano devuelve vacio', () => {
    expect(bloquesIlegibles(`x\n${bloque('{"a":1}')}\ny`)).toEqual([])
    expect(bloquesIlegibles('prosa sin bloques')).toEqual([])
  })
})
