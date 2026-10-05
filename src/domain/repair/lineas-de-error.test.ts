import { describe, expect, it } from 'vitest'
import { MAX_LINEAS_DE_ERROR, recolectorDeErrores } from './lineas-de-error'

const recoger = (...trozos: string[]): readonly string[] => {
  const r = recolectorDeErrores()
  trozos.forEach(r.anadir)
  return r.lineas()
}

describe('las lineas de error de los tres comandos del gate', () => {
  it('tsc: la linea ya trae su fichero', () => {
    expect(recoger("src/a.ts(12,3): error TS2345: Argument of type 'string'\n")).toEqual([
      "src/a.ts(12,3): error TS2345: Argument of type 'string'"
    ])
  })

  it('vitest: el test caido, la asercion y donde, sin los colores', () => {
    const salida = '\u001b[31m × \u001b[39mmi test 16ms\nAssertionError: expected 1 to be 2\n ❯ src/a.test.ts:54:88\n ✓ otro test\n' // prettier-ignore
    expect(recoger(salida)).toEqual(['× mi test 16ms', 'AssertionError: expected 1 to be 2', '❯ src/a.test.ts:54:88']) // prettier-ignore
  })

  it('eslint: un warning no es un error', () => {
    expect(recoger('/w/a.ts\n  3:1  warning  algo  regla\n')).toEqual([])
  })
})

describe('lo que la salida real le hace al recolector', () => {
  it('una linea partida entre dos trozos se recompone', () => {
    expect(recoger('/w/b.ts\n  7:2  err', 'or  Unexpected any  no-explicit-any\n')).toEqual([
      '/w/b.ts 7:2  error  Unexpected any  no-explicit-any'
    ])
  })

  it('la ultima linea sin salto final tambien cuenta', () => {
    expect(recoger('src/c.ts(1,1): error TS1005: falta algo')).toHaveLength(1)
  })

  it('se para al tope: un fallo en cascada no infla la autopsia', () => {
    const cascada = Array.from({ length: 500 }, (_, i) => `src/d.ts(${i},1): error TS2304: x`).join('\n') // prettier-ignore
    expect(recoger(cascada + '\n')).toHaveLength(MAX_LINEAS_DE_ERROR)
  })

  it('un secreto en el borde del recorte se tacha entero, no a medias', () => {
    const linea = `src/e.ts(1,1): error TS2322: ${'x'.repeat(262)} ghp_abcdefghijklmnopqrstuvwxyz0123\n`
    expect(recoger(linea)[0]).not.toContain('ghp_')
  })
})
