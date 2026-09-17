import { describe, expect, it } from 'vitest'
import type { Project } from '../project/project'
import { effectiveMode } from './modo-efectivo'

const CONFIABLE = { id: 'p1', trusted: true } as unknown as Project
const AJENO = { id: 'p2', trusted: false } as unknown as Project

/** Lo que el operador firmó: autónomo, proyecto de confianza, y red git. */
const FIRMADO = { mode: 'autonomo', selfRepo: false, project: CONFIABLE, redGit: true } as const

/**
 * ADR-089. El freno de palabras murió: `effectiveMode` ya no lee el texto de la
 * petición. Estos tests son el contrato nuevo, y su caso real es el que lo
 * motivó — un hallazgo llamado «falta Content-Security-Policy» degradaba porque
 * contenía «security», en una herramienta cuyos hallazgos son de seguridad por
 * definición. El freno impedía al producto hacer aquello para lo que existe.
 */
describe('un hallazgo de seguridad YA se resuelve en autonomo', () => {
  it('el caso que lo motivó: Content-Security-Policy ya no degrada', () => {
    expect(effectiveMode(FIRMADO)).toBe('autonomo')
  })

  it('el modo NO depende de lo que diga la peticion: no hay texto que leer', () => {
    // `ModoPedido` ya no tiene campo `request`. Si alguien lo reintroduce, este
    // test no lo caza — lo caza el compilador, que es mejor guardián.
    expect(Object.keys(FIRMADO)).not.toContain('request')
  })
})

describe('las TRES garantias estructurales siguen enteras', () => {
  it('el repo propio de FORTRESS sigue degradando', () => {
    expect(effectiveMode({ ...FIRMADO, selfRepo: true })).toBe('supervisado')
  })

  it('un proyecto sin confianza sigue degradando', () => {
    expect(effectiveMode({ ...FIRMADO, project: AJENO })).toBe('supervisado')
  })

  it('sin red git sigue degradando (ADR-079)', () => {
    expect(effectiveMode({ ...FIRMADO, redGit: false })).toBe('supervisado')
  })

  it('y sin proyecto tambien: sin el no hay confianza que consultar', () => {
    expect(effectiveMode({ ...FIRMADO, project: null })).toBe('supervisado')
  })
})

describe('supervisado nunca escala, con freno o sin el', () => {
  it('lo pedido manda hacia abajo, nunca hacia arriba', () => {
    expect(effectiveMode({ ...FIRMADO, mode: 'supervisado' })).toBe('supervisado')
  })
})
