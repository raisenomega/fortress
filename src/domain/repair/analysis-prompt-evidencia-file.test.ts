import { describe, expect, it } from 'vitest'
import { EMPTY_CORPUS } from '../project/corpus-descriptor'
import { CON_BASH } from '../agent/capacidades-fixture'
import { buildAnalysisPrompt } from './analysis-prompt'

// prettier-ignore
const TARGET = { id: 'f1', severity: 'LOW' as const, title: 't', file: 'src/a.ts', line: 1, firstSeen: '2026-01-01T00:00:00.000Z', tipo: 'path-traversal', simbolo: 'h' }

const prompt = (): string => buildAnalysisPrompt(TARGET, EMPTY_CORPUS, [], 'g', CON_BASH)

/** INC-4: el analista tiene que SABER que puede cerrar en otro fichero (ADR-087
 *  enmienda). Sin esta guia, la conducta de INC-1..3 existe pero nunca se usa. */
describe('el prompt guia la evidencia que cierra en OTRO fichero (touched-by-fix)', () => {
  it('ofrece "file" para el arreglo que cierra fuera del fichero detectado', () => {
    const t = prompt()
    expect(t).toContain('"file"')
    expect(t).toContain('migracion NUEVA que hace el')
  })

  it('avisa de que FORTRESS lo verifica POR GIT: solo si el arreglo lo toco', () => {
    // El anti-mutante: sin esta frase un fichero ajeno pareceria valido.
    const t = prompt()
    expect(t).toContain('POR')
    expect(t).toContain('tocara ese fichero')
    expect(t).toContain('ajeno NO cierra')
  })

  it('pide un marcador que se ROMPA si el defecto vuelve (no trivial)', () => {
    expect(prompt()).toContain('se ROMPA si el defecto volviera')
  })
})
