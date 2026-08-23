import { describe, expect, it } from 'vitest'
import type { Analysis } from './analysis'
import { ILEGIBLE } from './analysis-ilegible'
import { isRejectionReason } from './repair-rejection'
import { isRetryable } from './retry-eligibility'
import { veredictoDelAnalisis } from './veredicto-del-analisis'

const analisis = (status: string, risk: string): Analysis =>
  ({
    target: { id: 'f1' },
    status,
    whatToChange: 'x',
    where: 'a.ts',
    patternToCopy: 'p',
    doNotTouch: 'n',
    risk,
    tokensUsed: 1
  }) as unknown as Analysis

/** Lo que devolvieron de verdad los tres CADUCADO del 21 y el 23 de agosto. */
const TRUNCADOS = ['}\n  ]\n}\n```', ']\n```', '']

describe('los tres desenlaces del analisis', () => {
  it('REAL sigue dejando la propuesta lista para C3', () => {
    expect(veredictoDelAnalisis(analisis('REAL', 'riesgo bajo'))).toEqual({
      verdict: 'REAL',
      state: 'ANALIZADO',
      reason: 'riesgo bajo'
    })
  })

  it('OBSOLETO de verdad sigue caducando', () => {
    const v = veredictoDelAnalisis(analisis('OBSOLETO', 'el fichero ya no llama a eso'))
    expect([v.verdict, v.state]).toEqual(['OBSOLETO', 'CADUCADO'])
  })

  it('ilegible NO es obsoleto: se rechaza, no caduca', () => {
    for (const cola of TRUNCADOS) {
      const v = veredictoDelAnalisis(analisis('DESCONOCIDO', `${ILEGIBLE}${cola}`))
      expect(v.verdict, cola).toBe('ILEGIBLE')
      expect(v.state, cola).toBe('RECHAZADO')
      expect(v.verdict, cola).not.toBe('OBSOLETO')
    }
  })

  it('la razon dice lo que paso, no que el hallazgo se fuera', () => {
    const v = veredictoDelAnalisis(analisis('DESCONOCIDO', `${ILEGIBLE}}  ]}`))
    expect(v.reason).toBe('analisis_ilegible: }  ]}')
    expect(isRejectionReason(v.reason.split(':')[0])).toBe(true)
  })

  it('se mira ANTES que el veredicto: un texto ilegible no opina', () => {
    // Un truncado puede dejar status en cualquier cosa. Preguntarle a
    // isActionable que opina de lo que no se pudo parsear inventa la respuesta.
    const v = veredictoDelAnalisis(analisis('OBSOLETO', `${ILEGIBLE}]`))
    expect(v.verdict).toBe('ILEGIBLE')
  })

  it('el ilegible admite UN reintento; el obsoleto no se reintenta', () => {
    const ilegible = veredictoDelAnalisis(analisis('DESCONOCIDO', `${ILEGIBLE}]`))
    expect(isRetryable('RECHAZADO', ilegible.reason)).toBe(true)
    expect(isRetryable('CADUCADO', 'el fichero ya no llama a eso')).toBe(false)
  })
})
