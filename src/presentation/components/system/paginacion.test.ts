import { describe, expect, it } from 'vitest'
import { paginar, POR_PAGINA } from './paginacion'

describe('paginar', () => {
  it('parte de quince en quince', () => {
    expect(POR_PAGINA).toBe(15)
  })

  it('con quince cabe todo en una pagina', () => {
    const p = paginar(15, 1)
    expect(p.paginas).toBe(1)
    expect([p.desde, p.hasta]).toEqual([0, 15])
  })

  it('con dieciseis hay dos paginas y la segunda trae una', () => {
    expect(paginar(16, 1).paginas).toBe(2)
    const segunda = paginar(16, 2)
    expect([segunda.desde, segunda.hasta]).toEqual([15, 16])
  })

  it('acota la pagina cuando firmar encoge la cola bajo los pies', () => {
    // Mirando la pagina dos de dieciseis, se firma una: quedan quince y la
    // pagina dos deja de existir. Sin acotar, la vista quedaba vacia.
    const p = paginar(15, 2)
    expect(p.pagina).toBe(1)
    expect([p.desde, p.hasta]).toEqual([0, 15])
  })

  it('la cola vacia sigue teniendo una pagina, no cero', () => {
    const p = paginar(0, 1)
    expect([p.pagina, p.paginas]).toEqual([1, 1])
    expect([p.desde, p.hasta]).toEqual([0, 0])
  })

  it('no admite paginas por debajo de la primera', () => {
    expect(paginar(30, 0).pagina).toBe(1)
    expect(paginar(30, -4).pagina).toBe(1)
  })

  it('treinta y uno son tres paginas y la ultima trae una', () => {
    const ultima = paginar(31, 3)
    expect(ultima.paginas).toBe(3)
    expect([ultima.desde, ultima.hasta]).toEqual([30, 31])
  })
})
