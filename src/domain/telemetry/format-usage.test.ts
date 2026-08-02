import { describe, expect, it } from 'vitest'
import { formatCost, formatTokens } from './format-usage'

describe('formatTokens', () => {
  it('deja los numeros pequenos tal cual', () => {
    expect(formatTokens(0)).toBe('0')
    expect(formatTokens(999)).toBe('999')
  })

  it('abrevia miles y millones', () => {
    expect(formatTokens(21_086)).toBe('21K')
    expect(formatTokens(1_450_000)).toBe('1.4M')
  })

  it('redondea a la baja: mejor sorpresa a la baja que falso alivio', () => {
    expect(formatTokens(41_999)).toBe('41K')
  })

  it('no muestra cifras negativas', () => {
    expect(formatTokens(-5)).toBe('0')
  })
})

describe('formatCost', () => {
  it('no afirma que algo fue gratis cuando no hay dato', () => {
    // Cero significa "el motor no reporta coste", no "no costo nada".
    expect(formatCost(0)).toBeNull()
  })

  it('marca los importes minusculos sin fingir precision', () => {
    expect(formatCost(0.0064)).toBe('<$0.01')
  })

  it('muestra dos decimales', () => {
    expect(formatCost(0.3512)).toBe('$0.35')
  })
})
