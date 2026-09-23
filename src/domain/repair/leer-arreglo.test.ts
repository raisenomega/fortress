import { describe, expect, it } from 'vitest'
import { leerArreglo } from './leer-arreglo'

describe('leerArreglo: el sitio del arreglo, sin fiarse de la forma (ADR-102 §2)', () => {
  it('objeto con file y line entero: viaja tal cual, con el file recortado', () => {
    expect(leerArreglo({ file: ' src/a/b.ts ', line: 12 })).toEqual({
      file: 'src/a/b.ts',
      line: 12
    })
  })

  it('line null vale: un defecto que es una ausencia no tiene linea', () => {
    expect(leerArreglo({ file: 'src/a/b.ts', line: null })).toEqual({
      file: 'src/a/b.ts',
      line: null
    })
  })

  it.each([
    undefined,
    null,
    'src/a/b.ts',
    3,
    [],
    { file: '', line: 1 },
    { file: '   ', line: 1 },
    { file: 'x.ts' },
    { file: 'x.ts', line: '12' },
    { file: 'x.ts', line: 1.5 },
    { line: 3 }
  ])('cualquier otra forma es «no dijo»: %j', (bruto) => {
    expect(leerArreglo(bruto)).toBeUndefined()
  })
})
