import { describe, expect, it } from 'vitest'
import { EMPTY_CORPUS } from '../project/corpus-descriptor'
import type { Analysis } from './analysis'
import { buildGeneratorPrompt } from './generator-prompt'

/**
 * ADR-115 A2. En la tanda del 2026-10-05 el lint tumbo tres arreglos buenos
 * (87 y 92 lineas en `fase-b-agente.ts`; un tipo de retorno en `medir-deriva`):
 * el prompt decia «limite de lineas» sin el numero. Los numeros son los que el
 * lint del repo hace cumplir en todo `.ts`/`.tsx` (`eslint.config.mjs`).
 */
const ANALISIS: Analysis = {
  target: { id: 'f1', severity: 'LOW', title: 't', file: 'scripts/a.ts', line: 1, firstSeen: '2026-01-01T00:00:00.000Z', tipo: 'otro', simbolo: 'x' }, // prettier-ignore
  status: 'REAL',
  whatToChange: 'w',
  where: 'scripts/a.ts',
  patternToCopy: '',
  doNotTouch: '',
  risk: 'bajo',
  tokensUsed: 1
}
const prompt = buildGeneratorPrompt(ANALISIS, EMPTY_CORPUS, ['scripts/a.ts', 'scripts/a.test.ts'])

describe('el generador conoce los limites del lint con su numero', () => {
  it.each([
    ['75 lineas por fichero', /75 lineas por fichero/],
    ['50 por funcion', /50 por funcion/],
    ['tipo de retorno explicito', /tipo de retorno explicito/],
    ['que comentarios y blancos cuentan', /comentarios y lineas en blanco cuentan/]
  ])('%s', (_, numero) => {
    expect(prompt).toMatch(numero)
  })

  it('la salida para un arreglo que no cabe NO es un fichero nuevo fuera de PERMITIDOS', () => {
    expect(prompt).toMatch(/fichero nuevo fuera de PERMITIDOS tumba la propuesta/)
  })
})
