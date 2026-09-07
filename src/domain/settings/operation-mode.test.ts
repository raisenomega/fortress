import { describe, expect, it } from 'vitest'
import { isProtectedArea, parseOperationMode } from './operation-mode'
import { effectiveMode } from './modo-efectivo'
import type { OperationMode } from './operation-mode'
import type { Project } from '../project/project'

const CONFIABLE = { id: 'p1', trusted: true } as Project

/** Atajo del banco: el objeto entero en cada llamada tapaba lo que se prueba. */
const modo = (mode: OperationMode, request: string, selfRepo = false): OperationMode =>
  effectiveMode({ mode, request, selfRepo, project: CONFIABLE, redGit: true })

describe('parseOperationMode', () => {
  it('acepta los modos validos', () => {
    expect(parseOperationMode('autonomo')).toBe('autonomo')
    expect(parseOperationMode('supervisado')).toBe('supervisado')
  })

  it('cae a supervisado ante cualquier valor desconocido', () => {
    expect(parseOperationMode(null)).toBe('supervisado')
    expect(parseOperationMode('')).toBe('supervisado')
    expect(parseOperationMode('AUTONOMO')).toBe('supervisado')
    expect(parseOperationMode('dios-modo')).toBe('supervisado')
  })
})

describe('isProtectedArea', () => {
  it('detecta las areas criticas de CLAUDE.md', () => {
    expect(isProtectedArea('arregla el auth')).toBe(true)
    expect(isProtectedArea('revisa RLS de la tabla')).toBe(true)
    expect(isProtectedArea('cambia el flujo de payments')).toBe(true)
  })

  it('detecta las areas en espanol, con y sin tildes', () => {
    // El bug: "autenticacion" no contiene "auth", asi que el freno no saltaba.
    expect(isProtectedArea('refactoriza la autenticación')).toBe(true)
    expect(isProtectedArea('cambia los pagos con tarjeta')).toBe(true)
    expect(isProtectedArea('revisa la seguridad y el cifrado')).toBe(true)
    expect(isProtectedArea('actualiza la contraseña del usuario')).toBe(true)
    expect(isProtectedArea('rota el token de sesión')).toBe(true)
    // Sin tildes tambien: el operador no siempre las escribe.
    expect(isProtectedArea('arregla la autorizacion')).toBe(true)
  })

  it('no marca peticiones inocuas', () => {
    expect(isProtectedArea('renombra una variable')).toBe(false)
    expect(isProtectedArea('formatea los archivos y ordena imports')).toBe(false)
  })
})

describe('effectiveMode', () => {
  it('degrada a supervisado si la peticion toca un area protegida', () => {
    expect(modo('autonomo', 'refactoriza el modulo de auth', false)).toBe('supervisado')
  })

  it('degrada tambien con la peticion en espanol', () => {
    expect(modo('autonomo', 'refactoriza la autenticación', false)).toBe('supervisado')
  })

  it('mantiene autonomo en trabajo rutinario', () => {
    expect(modo('autonomo', 'formatea los archivos', false)).toBe('autonomo')
  })

  it('nunca escala de supervisado a autonomo', () => {
    expect(modo('supervisado', 'formatea los archivos', false)).toBe('supervisado')
  })
})
