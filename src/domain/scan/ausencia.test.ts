import { describe, expect, it } from 'vitest'
import type { FindingMemory } from '../project/finding-memory'
import { ausentes, confirmadoPorUltimoEscaneo } from './ausencia'

const hallazgo = (identity: string, lifecycle: FindingMemory['lifecycle'] = 'ACTIVE'): FindingMemory =>
  ({ id: identity, identity, simbolo: null, severity: 'HIGH', title: 't', file: 'a.ts', line: 1, status: 'open', lifecycle, firstSeen: '2026-08-01T00:00:00Z', lastSeen: '2026-08-01T00:00:00Z', resolvedAt: null, mitigatedAt: null }) // prettier-ignore

describe('la ausencia ya no mata', () => {
  it('un vivo que el escaneo no nombro sigue vivo, sin mirar git', () => {
    // Antes moria si su ARCHIVO habia cambiado. En un repo activo eso se cumple
    // por defecto, y asi murieron dos hallazgos de la CSP por un comentario.
    const memoria = [hallazgo('csp'), hallazgo('ssrf')]
    expect(ausentes(memoria, new Set(['ssrf']))).toEqual([hallazgo('csp')])
  })

  it('lo que el escaneo SI nombro no esta ausente', () => {
    expect(ausentes([hallazgo('csp')], new Set(['csp']))).toEqual([])
  })

  it('los ya extintos no vuelven a la lista: cerrar es una transicion', () => {
    expect(ausentes([hallazgo('viejo', 'EXTINCT')], new Set())).toEqual([])
  })

  it('un mitigado ausente tampoco entra: su marca la decide otra pregunta', () => {
    expect(ausentes([hallazgo('m', 'MITIGATED')], new Set())).toEqual([])
  })
})

describe('confirmadoPorUltimoEscaneo', () => {
  const ULTIMO = '2026-08-23T11:50:00Z'

  it('visto en el ultimo escaneo: reconfirmado', () => {
    expect(confirmadoPorUltimoEscaneo(ULTIMO, ULTIMO)).toBe(true)
  })

  it('visto antes: sigue vivo, pero sin reconfirmar', () => {
    expect(confirmadoPorUltimoEscaneo('2026-08-21T09:18:00Z', ULTIMO)).toBe(false)
  })

  it('sin escaneo previo nada esta reconfirmado: no se ha mirado', () => {
    expect(confirmadoPorUltimoEscaneo(ULTIMO, null)).toBe(false)
    expect(confirmadoPorUltimoEscaneo('', ULTIMO)).toBe(false)
  })
})
