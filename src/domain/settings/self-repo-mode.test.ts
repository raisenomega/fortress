import { describe, expect, it } from 'vitest'
import { SELF_REPO_SUPERVISED } from './operation-mode'
import { effectiveMode } from './modo-efectivo'
import type { OperationMode } from './operation-mode'
import type { Project } from '../project/project'

const CONFIABLE = { id: 'p1', trusted: true } as Project

/** Atajo del banco: el objeto entero en cada llamada tapaba lo que se prueba. */
const modo = (mode: OperationMode, request: string, selfRepo = false): OperationMode =>
  effectiveMode({ mode, request, selfRepo, project: CONFIABLE, redGit: true })

/**
 * El repo propio degrada, no rechaza: leer y analizar FORTRESS desde el
 * Terminal es util (evito un ciclo innecesario del motor mas de una vez). Lo
 * que no puede pasar es que APLIQUE sin revision externa.
 */
describe('effectiveMode: el propio repo degrada a supervisado', () => {
  it('autonomo sobre el repo propio baja a supervisado', () => {
    expect(modo('autonomo', 'arregla el bug de target-path', true)).toBe('supervisado')
  })

  it('autonomo sobre otro proyecto se conserva', () => {
    expect(modo('autonomo', 'arregla el bug de target-path', false)).toBe('autonomo')
  })

  it('el area protegida sigue degradando aunque no sea el repo propio', () => {
    expect(modo('autonomo', 'revisa el login', false)).toBe('supervisado')
  })

  it('sin el tercer argumento el comportamiento anterior no cambia', () => {
    expect(modo('autonomo', 'limpia el codigo muerto', false)).toBe('autonomo')
    expect(modo('autonomo', 'revisa la autenticacion', false)).toBe('supervisado')
  })

  it('supervisado se queda supervisado, toque lo que toque', () => {
    expect(modo('supervisado', 'lo que sea', true)).toBe('supervisado')
  })

  it('el aviso al operador explica la degradacion y a donde ir', () => {
    expect(SELF_REPO_SUPERVISED).toContain('supervisado')
    expect(SELF_REPO_SUPERVISED).toContain('Auto-mejora')
  })

  it('una peticion inocente sobre los propios guards tambien degrada', () => {
    // El caso que motiva el guard: refactor entusiasta sobre su propia jaula.
    expect(modo('autonomo', 'simplifica esta funcion', true)).toBe('supervisado')
  })
})
