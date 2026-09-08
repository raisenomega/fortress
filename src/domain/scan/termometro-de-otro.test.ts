import { describe, expect, it } from 'vitest'
import type { DetectedFinding } from './detected-finding'
import type { TipoDeDefecto } from './tipo-de-defecto'
import { termometroDeOtro, UMBRAL_DE_OTRO } from './termometro-de-otro'

// prettier-ignore
const hallazgo = (tipo: TipoDeDefecto): DetectedFinding => ({
  severity: 'LOW', title: 't', file: 'f.ts', line: 1, tipo, simbolo: 'h'
})

const conOtros = (otros: number, total: number): readonly DetectedFinding[] => [
  ...Array.from({ length: otros }, () => hallazgo('otro')),
  ...Array.from({ length: total - otros }, () => hallazgo('rate-limit-ausente'))
]

describe('el termometro de otro (ADR-081)', () => {
  it('sin ningun otro no hay termometro: nada que anotar', () => {
    expect(termometroDeOtro(conOtros(0, 5))).toBeNull()
  })

  it('cuenta los otro sobre lo reportado en la corrida', () => {
    expect(termometroDeOtro(conOtros(2, 6))).toMatchObject({ otros: 2, total: 6 })
  })

  it('las dos corridas reales de mailbd superan el umbral', () => {
    // 2 de 6 y 2 de 7 el 2026-09-07: 33% y 29%, con el umbral en 15%.
    expect(termometroDeOtro(conOtros(2, 6))?.superaUmbral).toBe(true)
    expect(termometroDeOtro(conOtros(2, 7))?.superaUmbral).toBe(true)
  })

  it('justo en el umbral NO lo supera: el criterio es "por encima"', () => {
    const t = termometroDeOtro(conOtros(3, 20))

    expect(t?.proporcion).toBe(UMBRAL_DE_OTRO)
    expect(t?.superaUmbral).toBe(false)
  })

  it('uno de veinticinco esta dentro: otro sigue siendo destino legitimo', () => {
    expect(termometroDeOtro(conOtros(1, 25))?.superaUmbral).toBe(false)
  })
})
