import { describe, expect, it } from 'vitest'
import type { Project } from '../project/project'
import { effectiveMode } from './modo-efectivo'

const CONFIABLE = { id: 'p1', trusted: true } as Project
const AJENO = { id: 'p2', trusted: false } as Project
const pedir = (project: Project | null): string =>
  effectiveMode({ mode: 'autonomo', selfRepo: false, project, redGit: true })

describe('sobre un proyecto sin confianza el agente no edita por su cuenta', () => {
  it('no confiable en autonomo: degrada a supervisado', () => {
    // El vector: acceptEdits sobre un repo ajeno, sin que el operador vea nada.
    expect(pedir(AJENO)).toBe('supervisado')
  })

  it('sin proyecto tampoco: no hay confianza que consultar', () => {
    expect(pedir(null)).toBe('supervisado')
  })

  it('no-regresion: un proyecto de confianza sigue en autonomo', () => {
    expect(pedir(CONFIABLE)).toBe('autonomo')
  })

  it('no-regresion: el repo propio degrada aunque sea de confianza', () => {
    // prettier-ignore
    const modo = effectiveMode({ mode: 'autonomo', selfRepo: true, project: CONFIABLE, redGit: true })
    expect(modo).toBe('supervisado')
  })

  it('ADR-089: con confianza, un trabajo de seguridad YA NO degrada', () => {
    // Era la no-regresion contraria: «auth» degradaba aunque hubiera confianza.
    // El freno murio — la firma del operador (autonomo + confianza) manda.
    expect(pedir(CONFIABLE)).toBe('autonomo')
  })

  it('la degradacion solo aplica desde autonomo: supervisado no se mueve', () => {
    // prettier-ignore
    const modo = effectiveMode({ mode: 'supervisado', selfRepo: false, project: AJENO, redGit: true })
    expect(modo).toBe('supervisado')
  })
})
