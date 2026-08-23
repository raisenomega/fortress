import { describe, expect, it } from 'vitest'
import { paginar, POR_PAGINA } from './paginacion'

describe('paginar', () => {
  it('parte de diez en diez', () => {
    expect(POR_PAGINA).toBe(10)
  })

  it('con diez cabe todo en una pagina', () => {
    const p = paginar(10, 1)
    expect(p.paginas).toBe(1)
    expect([p.desde, p.hasta]).toEqual([0, 10])
  })

  it('dieciseis son dos paginas: diez y seis', () => {
    expect(paginar(16, 1).paginas).toBe(2)
    expect([paginar(16, 1).desde, paginar(16, 1).hasta]).toEqual([0, 10])
    expect([paginar(16, 2).desde, paginar(16, 2).hasta]).toEqual([10, 16])
  })

  it('acota la pagina cuando firmar encoge la cola bajo los pies', () => {
    // Mirando la pagina dos de dieciseis, se firman seis: quedan diez y la
    // pagina dos deja de existir. Sin acotar, la vista quedaba vacia.
    const p = paginar(10, 2)
    expect(p.pagina).toBe(1)
    expect([p.desde, p.hasta]).toEqual([0, 10])
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

  it('veintiuno son tres paginas y la ultima trae una', () => {
    const ultima = paginar(21, 3)
    expect(ultima.paginas).toBe(3)
    expect([ultima.desde, ultima.hasta]).toEqual([20, 21])
  })
})
