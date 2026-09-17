import { describe, expect, it } from 'vitest'
import type { Project } from '../project/project'
import { effectiveMode } from './modo-efectivo'
import { terminalPuedeResolver } from './terminal-puede-resolver'

const CONFIABLE = { id: 'p1', trusted: true } as Project
const AJENO = { id: 'p2', trusted: false } as Project
// Sin palabra de area protegida: esa parte es de cada turno, no del proyecto.

describe('el Terminal podria resolver aqui: confianza, no es el repo propio, hay red git', () => {
  it('de confianza, ajeno y con red git: si', () => {
    expect(terminalPuedeResolver({ project: CONFIABLE, selfRepo: false, redGit: true })).toBe(true)
  })

  it('el repo propio de FORTRESS, aunque sea de confianza: no (el lote no sale ahi)', () => {
    expect(terminalPuedeResolver({ project: CONFIABLE, selfRepo: true, redGit: true })).toBe(false)
  })

  it('sin red git: no, sin checkpoint no hay vuelta (ADR-079)', () => {
    expect(terminalPuedeResolver({ project: CONFIABLE, selfRepo: false, redGit: false })).toBe(
      false
    )
  })

  it('sin confianza, o sin proyecto: no', () => {
    expect(terminalPuedeResolver({ project: AJENO, selfRepo: false, redGit: true })).toBe(false)
    expect(terminalPuedeResolver({ project: null, selfRepo: false, redGit: true })).toBe(false)
  })
})

describe('es la parte por proyecto de effectiveMode, no una regla nueva', () => {
  it('coincide con effectiveMode en autonomo en las ocho combinaciones', () => {
    for (const project of [CONFIABLE, AJENO]) {
      for (const selfRepo of [false, true]) {
        for (const redGit of [false, true]) {
          const hechos = { project, selfRepo, redGit }
          const edita =
            effectiveMode({ mode: 'autonomo', ...hechos }) === 'autonomo'
          expect(terminalPuedeResolver(hechos)).toBe(edita)
        }
      }
    }
  })
})
