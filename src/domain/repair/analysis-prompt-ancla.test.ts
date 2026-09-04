import { describe, expect, it } from 'vitest'
import { EMPTY_CORPUS } from '../project/corpus-descriptor'
import { buildAnalysisPrompt } from './analysis-prompt'

// prettier-ignore
const TARGET = { id: 'f1', severity: 'LOW' as const, title: 't', file: 'src/a.ts', line: 1, firstSeen: '2026-01-01T00:00:00.000Z', tipo: null, simbolo: null }
describe('el ancla no es donde va el arreglo', () => {
  const p = (): string => buildAnalysisPrompt(TARGET, EMPTY_CORPUS, [], 'g')

  it('dice que el ancla es donde se DETECTO, no donde se arregla', () => {
    expect(p()).toContain('donde se DETECTO el defecto, no donde va el')
  })

  it('nombra las dos razones por las que "where" puede ir a otro sitio', () => {
    // Una ausencia no esta en ninguna linea; y las capas pueden prohibir
    // arreglarlo justo donde se vio.
    expect(p()).toContain('una AUSENCIA no esta en ninguna linea')
    expect(p()).toContain('reglas de capas')
  })

  it('dos defectos en un hallazgo: lo dice y trata el del ancla', () => {
    expect(p()).toContain('partirlo es del escaner, no tuyo')
  })
})
