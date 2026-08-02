import { describe, expect, it } from 'vitest'
import { effectiveMode, isProtectedArea } from './operation-mode'

describe('isProtectedArea', () => {
  it('detecta las areas criticas de CLAUDE.md', () => {
    expect(isProtectedArea('arregla el auth')).toBe(true)
    expect(isProtectedArea('revisa RLS de la tabla')).toBe(true)
    expect(isProtectedArea('cambia el flujo de payments')).toBe(true)
  })

  it('no marca peticiones inocuas', () => {
    expect(isProtectedArea('renombra una variable')).toBe(false)
  })
})

describe('effectiveMode', () => {
  it('degrada a supervisado si la peticion toca un area protegida', () => {
    expect(effectiveMode('autonomo', 'refactoriza el modulo de auth')).toBe('supervisado')
  })

  it('mantiene autonomo en trabajo rutinario', () => {
    expect(effectiveMode('autonomo', 'formatea los archivos')).toBe('autonomo')
  })

  it('nunca escala de supervisado a autonomo', () => {
    expect(effectiveMode('supervisado', 'formatea los archivos')).toBe('supervisado')
  })
})
