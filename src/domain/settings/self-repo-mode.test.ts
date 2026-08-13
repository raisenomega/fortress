import { describe, expect, it } from 'vitest'
import { effectiveMode, SELF_REPO_SUPERVISED } from './operation-mode'

/**
 * El repo propio degrada, no rechaza: leer y analizar FORTRESS desde el
 * Terminal es util (evito un ciclo innecesario del motor mas de una vez). Lo
 * que no puede pasar es que APLIQUE sin revision externa.
 */
describe('effectiveMode: el propio repo degrada a supervisado', () => {
  it('autonomo sobre el repo propio baja a supervisado', () => {
    expect(effectiveMode('autonomo', 'arregla el bug de target-path', true)).toBe('supervisado')
  })

  it('autonomo sobre otro proyecto se conserva', () => {
    expect(effectiveMode('autonomo', 'arregla el bug de target-path', false)).toBe('autonomo')
  })

  it('el area protegida sigue degradando aunque no sea el repo propio', () => {
    expect(effectiveMode('autonomo', 'revisa el login', false)).toBe('supervisado')
  })

  it('sin el tercer argumento el comportamiento anterior no cambia', () => {
    expect(effectiveMode('autonomo', 'limpia el codigo muerto')).toBe('autonomo')
    expect(effectiveMode('autonomo', 'revisa la autenticacion')).toBe('supervisado')
  })

  it('supervisado se queda supervisado, toque lo que toque', () => {
    expect(effectiveMode('supervisado', 'lo que sea', true)).toBe('supervisado')
  })

  it('el aviso al operador explica la degradacion y a donde ir', () => {
    expect(SELF_REPO_SUPERVISED).toContain('supervisado')
    expect(SELF_REPO_SUPERVISED).toContain('Auto-mejora')
  })

  it('una peticion inocente sobre los propios guards tambien degrada', () => {
    // El caso que motiva el guard: refactor entusiasta sobre su propia jaula.
    expect(effectiveMode('autonomo', 'simplifica esta funcion', true)).toBe('supervisado')
  })
})
