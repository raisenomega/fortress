import { describe, expect, it } from 'vitest'
import { senasDelHallazgo } from './analysis-prompt-senas'
import type { Candidate } from './select-target'

const t = (over: Partial<Candidate>): Candidate =>
  ({ id: 'f1', severity: 'LOW', title: 't', file: 'a.ts', line: 1, firstSeen: '2026-01-01',
     tipo: null, simbolo: null, ...over }) as Candidate // prettier-ignore

describe('el analista recibe de que CLASE es el defecto y DONDE vive', () => {
  it('la clase va nombrada como vocabulario cerrado', () => {
    expect(senasDelHallazgo(t({ tipo: 'path-traversal' })).join('\n')).toContain(
      'Clase del defecto: path-traversal (vocabulario cerrado).'
    )
  })

  it('el simbolo AVISA de que viene en minusculas', () => {
    // Sin el aviso buscaria `graph_tool_rule` literal, no lo encontraria, y
    // concluiria OBSOLETO: el falso cierre que la red de extincion impide.
    const linea = senasDelHallazgo(t({ simbolo: 'graph_tool_rule' })).join('\n')

    expect(linea).toContain('"graph_tool_rule"')
    expect(linea).toContain('sin distinguir mayusculas')
  })

  it('sin senas NO escribe seccion: los 127 del formato viejo no las tienen', () => {
    expect(senasDelHallazgo(t({}))).toEqual([])
  })

  it('con una sola sena escribe solo esa', () => {
    expect(senasDelHallazgo(t({ tipo: 'secret-in-env' }))).toHaveLength(2)
  })
})
