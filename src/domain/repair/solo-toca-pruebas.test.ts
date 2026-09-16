import { describe, expect, it } from 'vitest'
import { esFicheroDePrueba, soloTocaPruebas } from './solo-toca-pruebas'
import { casillaDeBaja } from './clasificacion-de-baja'
import { isRejectionReason } from './repair-rejection'
import { isRetryable } from './retry-eligibility'

const ANCLA = 'src/application/genesis/run-genesis.ts'

/**
 * El caso REAL que lo motiva (backlog de auto-mejora): el analisis dijo que el
 * ancla no necesitaba cambios y que hacia falta un ADR humano, y el motor
 * entrego una propuesta que solo tocaba los tests del ancla. El gate la habria
 * dado verde —lo estaba— y el hallazgo seguiria vivo.
 */
describe('un fix que solo toca pruebas no arregla el defecto', () => {
  it('el caso que se pillo: el diff entero son tests y el ancla es produccion', () => {
    expect(soloTocaPruebas(['src/application/genesis/run-genesis.test.ts'], ANCLA)).toBe(true)
  })

  it('con UN fichero de produccion en el diff, ya no es el caso', () => {
    const diff = ['src/application/genesis/run-genesis.test.ts', 'src/infrastructure/x.ts']

    expect(soloTocaPruebas(diff, ANCLA)).toBe(false)
  })

  it('si el hallazgo ESTA en un test, tocar solo tests es el arreglo correcto', () => {
    const diff = ['src/domain/a.test.ts']

    expect(soloTocaPruebas(diff, 'src/domain/a.test.ts')).toBe(false)
  })

  it('un diff vacio no es cosa suya: de eso ya responde `no_diff_produced`', () => {
    expect(soloTocaPruebas([], ANCLA)).toBe(false)
  })

  it('reconoce el molde del repo, y NO se traga fixtures ni helpers', () => {
    expect(esFicheroDePrueba('a/b.test.ts')).toBe(true)
    expect(esFicheroDePrueba('a/b.test.tsx')).toBe(true)
    // Un fixture se toca junto al codigo: contarlo convertiria fixes en rechazos.
    expect(esFicheroDePrueba('a/b-fixture.ts')).toBe(false)
    expect(esFicheroDePrueba('a/b.ts')).toBe(false)
    expect(esFicheroDePrueba('a/testing.ts')).toBe(false)
  })
})

describe('el motivo entra en el vocabulario con sus tres decisiones', () => {
  it('es un motivo de baja reconocido', () => {
    expect(isRejectionReason('solo_pruebas')).toBe(true)
  })

  it('se clasifica MIRANDO el diff, como sus hermanas de correa', () => {
    expect(casillaDeBaja('solo_pruebas')).toBe('porCorrea')
  })

  it('y se reintenta: es un fallo de razonamiento, no de la maquina', () => {
    expect(isRetryable('RECHAZADO', 'solo_pruebas')).toBe(true)
  })
})
