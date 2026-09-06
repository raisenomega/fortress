import { describe, expect, it } from 'vitest'
import { EMPTY_CORPUS } from '../project/corpus-descriptor'
import { buildAnalysisPrompt } from './analysis-prompt'

// prettier-ignore
const TARGET = { id: 'f1', severity: 'LOW' as const, title: 't', file: 'src/a.ts', line: 1, firstSeen: '2026-01-01T00:00:00.000Z', tipo: 'path-traversal', simbolo: 'handleverify' }
const prompt = (): string => buildAnalysisPrompt(TARGET, EMPTY_CORPUS, [], 'g')

/**
 * Tres callejones que el analista recorrio muchas veces y el prompt no le
 * ahorraba: pedir Bash —que no tiene—, barrer el repo entero con un patron
 * corto, y creer que abrir el fichero del ancla desobedece al grafo primero.
 */
describe('el prompt del analista no lo manda a callejones', () => {
  it('le dice que NO tiene Bash, y que lo sustituye', () => {
    expect(prompt()).toContain('NO tienes Bash')
    expect(prompt()).toContain('dilo en "notes" en vez de suponerlo')
  })

  it('le dice como acotar la busqueda, y que file_pattern es una SUBCADENA', () => {
    expect(prompt()).toContain('Acota por ruta desde la PRIMERA llamada')
    expect(prompt()).toContain('SUBCADENA')
  })

  it('le dice que un .md se lee con Read, no volcandolo del grafo', () => {
    expect(prompt()).toContain('para leer un documento usa Read')
  })

  it('deshace el conflicto entre grafo primero y verificar el ancla', () => {
    expect(prompt()).toContain('NO contradice el grafo primero')
  })
})
