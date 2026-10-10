import { describe, expect, it } from 'vitest'
import { marcoDeGrafo, type GrafoOverview } from './marco-de-grafo'

const lleno: GrafoOverview = {
  nodes: 17651,
  edges: 45274,
  languages: Array.from({ length: 9 }, (_, i) => ({ name: `L${i}`, files: i })),
  clusters: Array.from({ length: 12 }, (_, i) => ({ label: `C${i}`, members: 100 - i }))
}

describe('marcoDeGrafo: radio del grafo como texto, sin ruido', () => {
  it('null -> texto vacio (cae solo en bloqueCtoKit)', () => {
    expect(marcoDeGrafo(null).texto).toBe('')
    expect(marcoDeGrafo(null).nombre).toBe('grafo-arquitectura')
  })

  it('resume nodos, aristas y el conteo real de clusters', () => {
    const t = marcoDeGrafo(lleno).texto
    expect(t).toContain('17651 nodos · 45274 aristas')
    expect(t).toContain('modulos de facto (12):')
  })

  it('TOPE: 6 lenguajes y 8 clusters como maximo', () => {
    const t = marcoDeGrafo(lleno).texto
    expect(t).toContain('L5(5)')
    expect(t).not.toContain('L6(6)')
    expect(t).toContain('· C7 (93)')
    expect(t).not.toContain('· C8')
  })
})
