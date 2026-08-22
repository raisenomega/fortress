import { describe, expect, it } from 'vitest'
import { EMPTY_CORPUS } from '../project/corpus-descriptor'
import { buildAnalysisPrompt } from './analysis-prompt'

// prettier-ignore
const TARGET = { id: 'f1', severity: 'LOW' as const, title: 't', file: 'src/a.ts', line: 1, firstSeen: '2026-01-01T00:00:00.000Z' }

const prompt = (): string => buildAnalysisPrompt(TARGET, EMPTY_CORPUS)

describe('el prompt le dice al modelo la regla que antes solo sabia el codigo', () => {
  it('exige UN UNICO objeto, y prohibe un segundo bloque', () => {
    expect(prompt()).toContain('UN UNICO objeto JSON')
    expect(prompt()).toContain('ni un segundo bloque')
  })

  it('explica POR QUE: el barrido del primer brace al ultimo', () => {
    // Una restriccion con motivo se respeta mejor que una arbitraria, y el
    // motivo cabe en una linea: asi el modelo sabe que se juega al desviarse.
    expect(prompt()).toContain('del primer { al ultimo }')
  })

  it('dice que "notes" va DENTRO del objeto y nunca aparte', () => {
    expect(prompt()).toContain('"notes" va DENTRO del objeto')
    expect(prompt()).toContain('NUNCA en un bloque aparte')
  })

  it('el ejemplo ensena notes como clave del objeto, no como array suelto', () => {
    // El defecto original: el ejemplo era `[{"kind":...}]` a secas, tras una
    // linea en blanco. Se leia como una seccion propia, y eso respondio el
    // analista. El ejemplo tiene que ser el objeto entero con la clave dentro.
    const texto = prompt()
    expect(texto).toContain('"risk":"...","notes":[{"kind":')
    expect(texto).not.toMatch(/\n\[\{"kind"/)
  })

  it('sigue pidiendo las seis claves y el veredicto', () => {
    for (const clave of ['status', 'whatToChange', 'where', 'patternToCopy', 'doNotTouch', 'risk'])
      expect(prompt()).toContain(`"${clave}"`)
    expect(prompt()).toContain('"REAL" u "OBSOLETO"')
  })
})
