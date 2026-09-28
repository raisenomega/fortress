import { describe, expect, it } from 'vitest'
import { sanearParaPrompt } from './sanear-para-prompt'

/**
 * Los 22 que se midieron el 2026-09-27. Sobrevivian 19: unos porque la primera
 * sustitucion solo miraba `\r\n\t`, otros porque la segunda exigia DOS blancos
 * seguidos, y ocho porque JavaScript no los considera blancos en absoluto.
 */
const CONTROLES: readonly (readonly [string, string])[] = [
  ['TAB', '\u0009'], ['LF', '\u000A'], ['VT', '\u000B'], ['FF', '\u000C'], ['CR', '\u000D'],
  ['NEL', '\u0085'], ['NBSP', ' '], ['LINE SEPARATOR', ' '],
  ['PARAGRAPH SEPARATOR', ' '], ['ZWSP', '​'], ['LRE', '‪'], ['RLO', '‮'],
  ['LRI', '⁦'], ['PDI', '⁩'], ['NUL', '\u0000'], ['SOH', '\u0001'], ['ESC', '\u001B'],
  ['DEL', '\u007F'], ['OGHAM', ' '], ['NNBSP', ' '], ['IDEOGRAPHIC SPACE', '　'],
  ['BOM', '﻿']
] // prettier-ignore

describe('ningun separador ni control deja texto ajeno en dos lineas', () => {
  it.each(CONTROLES)('%s solo, en medio de la frase, queda aplanado', (_, ch) => {
    expect(sanearParaPrompt(`a${ch}b`)).toBe('a b')
  })

  it.each(CONTROLES)('%s repetido tampoco sobrevive', (_, ch) => {
    expect(sanearParaPrompt(`a${ch}${ch}${ch}b`)).toBe('a b')
  })

  it('una racha MEZCLADA colapsa en un solo espacio', () => {
    expect(sanearParaPrompt('a \u0085\u000B ​b')).toBe('a b')
  })
})

describe('el texto legitimo no cambia: el control aplana, no censura', () => {
  it.each([
    'Endpoint sin sesion',
    'api/users.ts:10',
    'El checkout cobra el precio que llega en el cuerpo de la peticion',
    'hooks PreToolUse -> .husky/pre-commit',
    'acentos: configuracion, version, n',
    'ruta con espacios/mi carpeta/x.ts',
    '«comillas» y guion largo'
  ])('%s sale identico', (texto) => {
    expect(sanearParaPrompt(texto)).toBe(texto)
  })

  it('sigue colapsando los espacios de sobra y acotando con la marca de corte', () => {
    expect(sanearParaPrompt('texto  con   espacios')).toBe('texto con espacios')
    expect(sanearParaPrompt('x'.repeat(400))).toBe(`${'x'.repeat(200)}…`)
  })
})
