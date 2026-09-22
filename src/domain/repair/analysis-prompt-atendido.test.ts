import { describe, expect, it } from 'vitest'
import { EMPTY_CORPUS } from '../project/corpus-descriptor'
import { CON_BASH } from '../agent/capacidades-fixture'
import { buildAnalysisPrompt } from './analysis-prompt'
import { seccionAtendido } from './analysis-prompt-atendido'

// prettier-ignore
const TARGET = { id: 'f1', severity: 'LOW' as const, title: 't', file: 'src/a.ts', line: 1, firstSeen: '2026-01-01T00:00:00.000Z', tipo: 'path-traversal', simbolo: 'handleverify' }
const prompt = (atendidas: readonly string[]): string =>
  buildAnalysisPrompt(TARGET, EMPTY_CORPUS, atendidas, 'home-jojo-repo', CON_BASH)

describe('el analista lee lo ya atendido antes de observar', () => {
  it('con cerradas, el prompt las lleva y le dice que no las repita', () => {
    const p = prompt(['grafo — auto-indexa sin permiso'])

    expect(p).toContain('YA ATENDIDO')
    expect(p).toContain('NO las vuelvas a poner en "notes"')
    expect(p).toContain('- grafo — auto-indexa sin permiso')
  })

  it('sin cerradas NO hay seccion: ni encabezado ni hueco', () => {
    expect(prompt([])).not.toContain('YA ATENDIDO')
    expect(seccionAtendido([])).toEqual([])
  })

  it('la seccion va al final, pegada a la peticion de notes', () => {
    const p = prompt(['a — b'])

    expect(p.indexOf('YA ATENDIDO')).toBeGreaterThan(p.indexOf('Clave OPCIONAL "notes"'))
  })

  it('NO le manda callar: un descarte equivocado sigue siendo hallazgo', () => {
    // Sin esto la lista seria una forma de enterrar defectos por obediencia.
    expect(prompt(['a — b'])).toContain('ves que un descarte fue un error')
  })

  it('el resto del prompt sigue entero con la seccion puesta', () => {
    const p = prompt(['a — b'])

    expect(p).toContain('GRAFO PRIMERO')
    expect(p).toContain('UN UNICO objeto JSON')
  })

  it('cada linea va como item, no pegadas en un parrafo', () => {
    expect(seccionAtendido(['uno', 'dos']).slice(-2)).toEqual(['- uno', '- dos'])
  })
})
