import { describe, expect, it } from 'vitest'
import { avisoSinVerificar, CONSERVADO_SIN_VERIFICAR } from './aviso-sin-verificar'
import { noSePudoVerificar, porQueNoSePudo } from './no-se-pudo-verificar'

describe('el recibo dice POR QUE no se pudo verificar, no un motivo generico', () => {
  it('sin caja (ADR-092): desconocida, y el motivo es la maquina, no el fix', () => {
    const salida = { code: 127, out: 'sin-caja:falta-bwrap' }
    expect(noSePudoVerificar(salida)).toBe(true)
    expect(porQueNoSePudo(salida)).toBe('sin-caja')
  })

  it('vfat sin enlaces: npm no puede crear node_modules/.bin — desconocida, no rojo', () => {
    const salida = { code: 1, out: "npm error EPERM: operation not permitted, symlink '../x/bin/x' -> 'node_modules/.bin/x'" } // prettier-ignore
    expect(noSePudoVerificar(salida)).toBe(true)
    expect(porQueNoSePudo(salida)).toBe('sin-enlaces')
  })

  it('un EPERM que no es de un enlace sigue siendo ROJO: eso si puede ser del fix', () => {
    expect(noSePudoVerificar({ code: 1, out: 'EPERM: operation not permitted, open /etc/x' })).toBe(
      false
    )
  })

  it('la herramienta que falta sigue diciendo eso', () => {
    expect(porQueNoSePudo({ code: 127, out: 'sh: 1: tsc: not found' })).toBe('sin-herramienta')
    expect(porQueNoSePudo({ code: 1, out: 'npm ERR! missing script: typecheck' })).toBe(
      'sin-script'
    )
  })

  it('y cada motivo tiene su frase, distinta y sin culpar al fix', () => {
    const motivos = ['sin-caja', 'sin-enlaces', 'sin-herramienta', 'sin-script'] as const
    const frases = motivos.map(avisoSinVerificar)
    expect(new Set(frases).size).toBe(4)
    expect(avisoSinVerificar('sin-enlaces')).toMatch(/enlaces/)
    expect(avisoSinVerificar('sin-caja')).toMatch(/caja|bwrap/)
    for (const f of frases) expect(f).toMatch(/SIN comprobar/)
  })

  it('sin causa conocida: el generico, que no culpa a nada en concreto', () => {
    expect(avisoSinVerificar(null)).toBe(CONSERVADO_SIN_VERIFICAR)
  })
})
