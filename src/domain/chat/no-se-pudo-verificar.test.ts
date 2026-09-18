import { describe, expect, it } from 'vitest'
import { noSePudoVerificar } from './no-se-pudo-verificar'

const salida = (code: number, out = ''): { code: number; out: string } => ({ code, out })

/**
 * ADR-091 §2. El gate confundia dos cosas opuestas bajo el mismo rojo: «tu fix
 * rompio esto» y «aqui no habia con que compilar». Estos tests fijan la frontera
 * — y el caso del medio es el que costo el turno del 18-sep.
 */
describe('cuando el gate NO llego a medir nada', () => {
  it('sin script: no habia esa intencion que correr', () => {
    expect(noSePudoVerificar(salida(1, 'npm error Missing script: "typecheck"'))).toBe(true)
  })

  it('EL CASO DEL ENSAYO: el script existe y la herramienta no', () => {
    // raisen-nucleo, 18-sep: `typecheck` es `tsc --noEmit` y estaba en el
    // package.json. Sin node_modules, `sh: 1: tsc: not found` y rc 127. No casa
    // con «missing script», asi que caia como rojo y el turno revertia.
    expect(noSePudoVerificar(salida(127, 'sh: 1: tsc: not found'))).toBe(true)
  })

  it('el 127 basta aunque el runner no deje el texto', () => {
    expect(noSePudoVerificar(salida(127))).toBe(true)
  })

  it('y el texto basta aunque el runner se trague el 127', () => {
    // Un envoltorio puede devolver su propio codigo. Ante la duda, desconocida.
    expect(noSePudoVerificar(salida(1, 'vitest: not found'))).toBe(true)
  })
})

describe('lo que SI es un fallo, y debe revertir', () => {
  it('un error de tipos es del fix, no del terreno', () => {
    expect(noSePudoVerificar(salida(1, "error TS2304: Cannot find name 'foo'"))).toBe(false)
  })

  it('un test en rojo tambien', () => {
    expect(noSePudoVerificar(salida(1, '2 failed | 40 passed'))).toBe(false)
  })

  it('«cannot find module» NO es terreno ausente: el fix importo algo que no esta', () => {
    // Deliberado: se parece a «not found» pero es otra cosa. Si esto colara
    // como desconocida, un import roto se conservaria sin que nadie lo viera.
    expect(noSePudoVerificar(salida(1, "Cannot find module './perdido'"))).toBe(false)
  })
})
