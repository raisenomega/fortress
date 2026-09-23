import { describe, expect, it } from 'vitest'
import { arregloFueraDeCorrea } from './arreglo-fuera-de-correa'

const ALLOWED = ['src/a/b.ts', 'src/a/b.test.ts', 'src/a/b.spec.ts']

describe('arregloFueraDeCorrea: la regla del diff, aplicada antes de generar (ADR-102 §3)', () => {
  it('dentro de la correa literal: nada que parar', () => {
    expect(arregloFueraDeCorrea({ file: 'src/a/b.ts', line: 1 }, ALLOWED, [])).toBeNull()
  })

  it('dentro del terreno que el proyecto declaro (glob): nada que parar', () => {
    expect(arregloFueraDeCorrea({ file: 'src/infra/x.ts', line: 3 }, ALLOWED, ['src/infra/**'])).toBeNull() // prettier-ignore
  })

  it('fuera: devuelve el arreglo, y la correa queda EXACTAMENTE como estaba', () => {
    const allowed = [...ALLOWED]
    const fuera = arregloFueraDeCorrea({ file: 'src/infra/x.ts', line: 3 }, allowed, [])
    expect(fuera).toEqual({ file: 'src/infra/x.ts', line: 3 })
    expect(allowed).toEqual(ALLOWED)
  })

  it('sin arreglo declarado: nada que parar, se genera como hoy (casilla 1)', () => {
    expect(arregloFueraDeCorrea(undefined, ALLOWED, [])).toBeNull()
  })

  it('lo vetado por el scope-check no cabe ni aunque la correa lo nombre: misma regla que el diff', () => {
    for (const veto of ['.fortress/config', '.git/hooks/pre-commit', '../fuera.ts']) {
      expect(arregloFueraDeCorrea({ file: veto, line: 1 }, [veto], [])).toEqual({
        file: veto,
        line: 1
      })
    }
  })
})
