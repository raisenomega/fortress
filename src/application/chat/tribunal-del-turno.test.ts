import { describe, expect, it } from 'vitest'
import type { VerificacionDelArbol } from '@domain/chat/verificacion-del-arbol'
import { corresponde, debateSinBuild } from './tribunal-del-turno'

const TODOS: readonly VerificacionDelArbol[] = ['verde', 'rojo', 'desconocida']

/**
 * ADR-096. Cuando corre el tribunal, y por que DESCONOCIDA no lo exime.
 */
describe('el tribunal corre con verde y con desconocida, no con rojo', () => {
  it('con VERDE corre: es el caso normal', () => {
    expect(corresponde('verde')).toBe(true)
  })

  it('con DESCONOCIDA TAMBIEN corre, y ahi es cuando mas vale', () => {
    // El critico NAVEGA, no compila: puede ver que el fix rompe a quien lo
    // llama en un arbol que no compilo. Saltarselo «porque es caro y encima no
    // compila» seria el freno de bolsillo que ADR-090 §0 prohibe.
    expect(corresponde('desconocida')).toBe(true)
  })

  it('con ROJO no corre: el gate ya dictamino y criticar seria repetirlo', () => {
    expect(TODOS.filter((a) => !corresponde(a))).toEqual(['rojo'])
  })
})

/**
 * ADR-096 §5 del recibo: el operador tiene que saber que el debate se formo
 * sobre un arbol que nadie pudo compilar. No invalida el veredicto —el critico
 * leyo codigo de verdad— pero lo acota.
 */
describe('el parte dice cuando el debate se formo SIN build', () => {
  it('con desconocida y objeciones: avisa', () => {
    expect(debateSinBuild('desconocida', 2)).toBe(true)
  })

  it('con verde no avisa: hubo build y el debate lo tuvo delante', () => {
    expect(debateSinBuild('verde', 2)).toBe(false)
  })

  it('sin objeciones no avisa aunque falte el build: no hubo debate que acotar', () => {
    // Avisar de un debate que no existio seria ruido, y el ruido se ignora.
    expect(debateSinBuild('desconocida', 0)).toBe(false)
  })

  it('desconocida NO se lee como verde, ni aqui', () => {
    // La leccion de ADR-091 aplicada a este aviso: si `seVerifico` colara
    // desconocida como verde, el operador no sabria que nadie compilo.
    expect(debateSinBuild('desconocida', 1)).not.toBe(debateSinBuild('verde', 1))
  })
})
