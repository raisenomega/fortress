import { describe, expect, it } from 'vitest'
import type { Project } from '../project/project'
import { effectiveMode, type ModoPedido } from './modo-efectivo'

const CONFIABLE = { id: 'p1', trusted: true } as Project
const AJENO = { id: 'p2', trusted: false } as Project

/** Todo a favor: es lo unico que deja al autonomo seguir siendo autonomo. */
const SANO: ModoPedido = {
  mode: 'autonomo',
  selfRepo: false,
  project: CONFIABLE,
  redGit: true
}

/**
 * Las CUATRO razones por las que el autonomo degrada, cada una sola con todo lo
 * demas a favor: asi ninguna se esconde detras de otra. La cuarta es la del
 * ADR-079, y este fichero es lo que la fija en el gate.
 */
describe('effectiveMode: las cuatro razones, cada una por separado', () => {
  it('sano: raiz de repo git + confianza + sin area protegida + no es el repo propio', () => {
    expect(effectiveMode(SANO)).toBe('autonomo')
  })

  it('1. el repo propio de FORTRESS', () => {
    expect(effectiveMode({ ...SANO, selfRepo: true })).toBe('supervisado')
  })

  it('2. el proyecto no es de confianza', () => {
    expect(effectiveMode({ ...SANO, project: AJENO })).toBe('supervisado')
  })

  it('4. sin red de reversion posible (ADR-079): no es raiz de un repo git con historia', () => {
    expect(effectiveMode({ ...SANO, redGit: false })).toBe('supervisado')
  })

  it('la cuarta solo aplica desde autonomo: supervisado no se mueve', () => {
    expect(effectiveMode({ ...SANO, mode: 'supervisado', redGit: false })).toBe('supervisado')
  })
})
