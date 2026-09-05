import { describe, expect, it, vi } from 'vitest'
import { conCarrilDeMerge, OCUPADO } from './carril-del-merge'
import type { CarrilDeMerge } from './auto-merge-types'

const libre = (): CarrilDeMerge & { sueltas: number } => {
  let sueltas = 0
  return { tomar: () => true, soltar: () => (sueltas += 1), get sueltas() { return sueltas } } // prettier-ignore
}
const ocupado: CarrilDeMerge = { tomar: () => false, soltar: () => {} }

describe('el turno del arbol vivo, solo durante el merge', () => {
  it('con el turno libre, la integracion automatica merge', async () => {
    expect(await conCarrilDeMerge(libre(), 'p1', 'automatica', () => Promise.resolve('ok'))).toBe('ok') // prettier-ignore
  })

  it('con el turno OCUPADO no se llega a tocar el arbol', async () => {
    // Es el caso: el operador esta firmando otra propuesta.
    const merge = vi.fn()

    expect(await conCarrilDeMerge(ocupado, 'p1', 'automatica', merge)).toBe(OCUPADO)
    expect(merge).not.toHaveBeenCalled()
  })

  it('la FIRMA no lo pide: su handler ya lo trae puesto', async () => {
    // Pedirlo seria bloquearse contra uno mismo: el turno no es reentrante, y
    // la firma se diferiria a si misma para siempre.
    const merge = vi.fn(() => Promise.resolve('ok'))

    expect(await conCarrilDeMerge(ocupado, 'p1', 'firmada', merge)).toBe('ok')
    expect(merge).toHaveBeenCalled()
  })

  it('suelta el turno al terminar', async () => {
    const c = libre()
    await conCarrilDeMerge(c, 'p1', 'automatica', () => Promise.resolve('ok'))

    expect(c.sueltas).toBe(1)
  })

  it('y lo suelta tambien si el merge LANZA', async () => {
    const c = libre()
    await expect(
      conCarrilDeMerge(c, 'p1', 'automatica', () => Promise.reject(new Error('boom')))
    ).rejects.toThrow('boom')

    expect(c.sueltas).toBe(1)
  })
})
