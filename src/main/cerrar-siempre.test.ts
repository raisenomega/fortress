import { describe, expect, it, vi } from 'vitest'
import { cerrarSiempre } from './cerrar-siempre'

describe('cerrarSiempre: el runner headless SIEMPRE cierra, aunque el drenaje lance', () => {
  it('si el trabajo LANZA, cierra IGUAL y sale con codigo !=0', async () => {
    const cerrar = vi.fn()
    const salir = vi.fn()
    await cerrarSiempre(() => Promise.reject(new Error('boom')), cerrar, salir)
    // Mutante: quitar el `finally` -> `cerrar` NO se llama -> el proceso colgaria
    // con el -wal vivo (el hueco del forense) -> este test ROJO.
    expect(cerrar).toHaveBeenCalledTimes(1)
    expect(salir).toHaveBeenCalledWith(1)
  })

  it('camino feliz: cierra y sale 0', async () => {
    const cerrar = vi.fn()
    const salir = vi.fn()
    await cerrarSiempre(() => Promise.resolve(), cerrar, salir)
    expect(cerrar).toHaveBeenCalledTimes(1)
    expect(salir).toHaveBeenCalledWith(0)
  })

  it('el cierre va DESPUES del trabajo (no se adelanta)', async () => {
    const orden: string[] = []
    await cerrarSiempre(
      () => Promise.resolve(void orden.push('trabajo')),
      () => void orden.push('cerrar'),
      () => void orden.push('salir')
    )
    expect(orden).toEqual(['trabajo', 'cerrar', 'salir'])
  })
})
