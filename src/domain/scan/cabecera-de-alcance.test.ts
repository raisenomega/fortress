import { describe, expect, it } from 'vitest'
import { alcance } from './cabecera-de-alcance'

/**
 * Backlog 3449f9e0: «SOLO estas carpetas: src, docs» era ambiguo —¿la carpeta
 * entera o sus ficheros sueltos?— y un agente lo leyo como los ficheros de la
 * raiz del repo. La cabecera lo dice ahora sin hueco por donde leerla mal.
 */
describe('la cabecera del alcance', () => {
  it('dice que cada carpeta va ENTERA, con todo su arbol dentro', () => {
    const texto = alcance('p', ['src', 'docs']).join('\n')
    expect(texto).toContain('SOLO estas carpetas')
    expect(texto).toContain('cada una entera, con todo su arbol de subcarpetas dentro')
    expect(texto).toContain('src, docs')
  })

  it('y conserva la frontera blanda: lo real de fuera se guarda igual', () => {
    const texto = alcance('p', ['src']).join('\n')
    expect(texto).toContain('reportalo')
    expect(texto).toContain('no lo recorras ahora')
  })
})
