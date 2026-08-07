import { describe, expect, it } from 'vitest'
import { splitBlocks } from './markdown-blocks'

describe('splitBlocks', () => {
  it('reconoce encabezados con su nivel', () => {
    const blocks = splitBlocks('# Titulo\n## Sub')
    expect(blocks[0]).toEqual({ type: 'heading', level: 1, lines: ['Titulo'] })
    expect(blocks[1].level).toBe(2)
  })

  it('agrupa items de lista en un solo bloque', () => {
    const blocks = splitBlocks('- uno\n- dos\n- tres')
    expect(blocks).toHaveLength(1)
    expect(blocks[0]).toEqual({ type: 'list', lines: ['uno', 'dos', 'tres'] })
  })

  it('captura un bloque de codigo cercado sin las cercas', () => {
    const blocks = splitBlocks('```\nconst x = 1\n```')
    expect(blocks[0]).toEqual({ type: 'code', lines: ['const x = 1'] })
  })

  it('las lineas en blanco no generan parrafos vacios', () => {
    expect(splitBlocks('hola\n\n\nmundo').filter((b) => b.type === 'text')).toHaveLength(2)
  })
})
