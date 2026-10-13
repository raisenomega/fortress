import { describe, expect, it } from 'vitest'
import { EMPTY_USAGE } from '@domain/telemetry/token-usage'
import { reporteDeTarea, textoDelReporte, type ResultadoDelTurno } from './reporte-de-tarea'

/** La honestidad del parte (familia INC-D). 'hecho'/'verificado' derivan de la
 *  PRESENCIA de trabajo y de un DICTAMEN real (los tres de ADR-087), NUNCA de
 *  !failed/!sinVerificar. El gate cazo que sinCierre===null cubre no_vivo y
 *  pendiente (cierre SIN dictamen): por eso la señal es el desenlace, no la
 *  ausencia. Revertir a la vieja derivacion hace que estos tests FALLEN: un
 *  turno vacio fingiria 'hecho · verificado'. */

const base: ResultadoDelTurno = {
  assistant: { content: 'x' }, failed: false, edits: [], sinCierre: null,
  sinVerificar: false, desenlace: null, usage: EMPTY_USAGE, modelo: 'm', hallazgos: 0
} // prettier-ignore

describe('el parte es honesto: presencia, no ausencia-de-negativo (INC-D)', () => {
  it('turno VACIO (no edito, no hubo dictamen): sin-cambios y sin_verificar, jamas hecho/verificado', () => {
    const r = reporteDeTarea(base)
    expect(r.estado).toBe('sin-cambios')
    expect(r.verificacion).toBe('sin_verificar')
  })

  it('no_vivo y pendiente NO son dictamen: jamas verificado (el error que cazo el gate)', () => {
    expect(reporteDeTarea({ ...base, desenlace: 'no_vivo' }).verificacion).toBe('sin_verificar')
    expect(reporteDeTarea({ ...base, edits: ['a'], desenlace: 'pendiente' }).verificacion).toBe('sin_verificar') // prettier-ignore
  })

  it('edito pero sin dictamen: hecho (hubo trabajo) pero sin_verificar', () => {
    const r = reporteDeTarea({ ...base, edits: ['a'], desenlace: null })
    expect(r.estado).toBe('hecho')
    expect(r.verificacion).toBe('sin_verificar')
  })

  it('sigue_vivo SI verifico (dictamen real): verificado, y el desenlace se VE en el parte', () => {
    const r = reporteDeTarea({ ...base, edits: ['a'], desenlace: 'sigue_vivo' })
    expect(r.verificacion).toBe('verificado')
    expect(textoDelReporte(r)).toContain('sigue_vivo')
  })

  it('dictamen real cuenta como trabajo; pero si NO compilo (sinVerificar) → sin_verificar', () => {
    expect(reporteDeTarea({ ...base, desenlace: 'extinguido' }).estado).toBe('hecho')
    expect(reporteDeTarea({ ...base, desenlace: 'extinguido' }).verificacion).toBe('verificado')
    expect(reporteDeTarea({ ...base, desenlace: 'extinguido', sinVerificar: true }).verificacion).toBe('sin_verificar') // prettier-ignore
  })
})
