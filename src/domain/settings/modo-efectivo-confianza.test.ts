import { describe, expect, it } from 'vitest'
import type { Project } from '../project/project'
import { effectiveMode } from './modo-efectivo'

const CONFIABLE = { id: 'p1', trusted: true } as Project
const AJENO = { id: 'p2', trusted: false } as Project
const pedir = (project: Project | null, request = 'formatea los archivos'): string =>
  effectiveMode({ mode: 'autonomo', request, selfRepo: false, project })

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
    const modo = effectiveMode({ mode: 'autonomo', request: 'limpia el codigo muerto', selfRepo: true, project: CONFIABLE })
    expect(modo).toBe('supervisado')
  })

  it('no-regresion: un area protegida degrada aunque haya confianza', () => {
    expect(pedir(CONFIABLE, 'refactoriza el modulo de auth')).toBe('supervisado')
  })

  it('la degradacion solo aplica desde autonomo: supervisado no se mueve', () => {
    // prettier-ignore
    const modo = effectiveMode({ mode: 'supervisado', request: 'lo que sea', selfRepo: false, project: AJENO })
    expect(modo).toBe('supervisado')
  })
})
