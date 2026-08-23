import { describe, expect, it } from 'vitest'
import { etiquetaFirma, tituloFirma } from './firma-chip-look'

describe('etiquetaFirma', () => {
  it('lleva el numero de las que esperan firma', () => {
    expect(etiquetaFirma(7)).toBe('Firma: 7')
  })
})

describe('tituloFirma', () => {
  it('concuerda en singular', () => {
    expect(tituloFirma(1)).toContain('1 propuesta espera')
  })

  it('concuerda en plural', () => {
    expect(tituloFirma(4)).toContain('4 propuestas esperan')
  })

  it('dice por que estan paradas', () => {
    expect(tituloFirma(2)).toContain('pasaron el gate')
  })
})
