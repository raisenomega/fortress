import { describe, expect, it } from 'vitest'
import type { Finding } from '../project/finding'
import { pendienteDeVerificar } from './cierre-del-ciclo'
import { desenlaceEnLote, resumenDelLote } from './desenlace-del-lote'

// prettier-ignore
const fila = (over: Partial<Finding>): Finding => ({ id: 'f1', lifecycle: 'ACTIVE', status: 'open', verificacionNote: null, ...over }) as Finding
const ANTES = fila({})

describe('como quedo cada hallazgo del lote, leido de la base tras recargar', () => {
  it('ya no esta en la lista viva, o extinguido: paso a Historia', () => {
    expect(desenlaceEnLote(ANTES, undefined)).toBe('extinguido')
    expect(desenlaceEnLote(ANTES, fila({ lifecycle: 'EXTINCT' }))).toBe('extinguido')
  })

  it('mitigado con la nota de pendiente: pendiente de verificar', () => {
    const nota = pendienteDeVerificar('el analista reviento')
    expect(desenlaceEnLote(ANTES, fila({ lifecycle: 'MITIGATED', verificacionNote: nota }))).toBe(
      'pendiente'
    )
  })

  it('mitigado con otra nota: sin prueba', () => {
    const despues = fila({ lifecycle: 'MITIGATED', verificacionNote: 'sin prueba: no se pudo' })
    expect(desenlaceEnLote(ANTES, despues)).toBe('sin_prueba')
  })

  it('activo con la nota cambiada: el analista dijo que sigue', () => {
    const despues = fila({ verificacionNote: 'sigue vivo: el problema esta en a.ts:3' })
    expect(desenlaceEnLote(ANTES, despues)).toBe('sigue_vivo')
  })

  it('activo como estaba: el turno no cerro', () => {
    expect(desenlaceEnLote(ANTES, fila({}))).toBe('no_cerro')
  })
})

describe('el parte del lote cuenta cada desenlace', () => {
  it('cuenta los cinco grupos, ceros incluidos', () => {
    const texto = resumenDelLote(['extinguido', 'extinguido', 'no_cerro', 'sin_prueba'], 4)
    expect(texto).toBe(
      'Lote: 4 de 4 procesados — 2 a Historia, 0 siguen activos, 1 sin prueba, ' +
        '0 pendientes de verificar, 1 no cerraron (degradaron, revirtieron o sin cambios).'
    )
  })

  it('dice cuantos quedaron sin lanzar si se corto, y los omitidos aparte', () => {
    const texto = resumenDelLote(['sigue_vivo', 'omitido'], 5)
    expect(texto).toContain('Lote: 1 de 5 procesados — 0 a Historia, 1 siguen activos')
    expect(texto).toContain('1 omitidos: ya no pedian trabajo.')
    expect(texto).toContain('Cortado: 3 sin lanzar.')
  })
})
