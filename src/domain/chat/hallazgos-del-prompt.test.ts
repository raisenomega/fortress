import { describe, expect, it } from 'vitest'
import { hallazgosDelTurno } from './hallazgos-del-prompt'

const DOS = ['HIGH a.ts:1 — uno', 'LOW b.ts:2 — dos']

describe('lo que el turno le cuenta al agente sobre hallazgos', () => {
  it('turno libre: el historial de escaneos anteriores', () => {
    const texto = hallazgosDelTurno({ known: DOS })

    expect(texto).toContain('Hallazgos ya registrados de escaneos anteriores:')
    expect(texto).toContain('- HIGH a.ts:1 — uno')
  })

  it('turno libre sin historial: lo dice, no inventa una lista vacia', () => {
    expect(hallazgosDelTurno({ known: [] })).toBe(
      'FORTRESS no tiene escaneos previos de este proyecto.'
    )
  })

  it('turno de PLAN del lote: son los del lote, no el historial', () => {
    const texto = hallazgosDelTurno({ known: DOS, deLote: true })

    expect(texto).toContain('Los hallazgos del lote que el operador quiere resolver:')
    expect(texto).not.toContain('escaneos anteriores')
  })

  it('con foco: SU bloque, y nada mas si no hay hermanos', () => {
    const texto = hallazgosDelTurno({ known: [], enFoco: 'BLOQUE' })

    expect(texto).toContain('Hallazgo a resolver')
    expect(texto).toContain('BLOQUE')
    expect(texto).not.toContain('- ')
  })

  it('con foco y lote: su bloque primero, y los hermanos como contexto', () => {
    const texto = hallazgosDelTurno({ known: DOS, enFoco: 'BLOQUE', deLote: true })

    expect(texto.indexOf('BLOQUE')).toBeLessThan(texto.indexOf('- HIGH a.ts:1 — uno'))
    expect(texto).toContain('NO los resuelvas en este turno')
  })
})
