import { afterEach, describe, expect, it } from 'vitest'
import { guardarAbierta, guardarExpandidas, leerAbierta, leerExpandidas } from './almacen-de-la-barra' // prettier-ignore

/** PASO 116/120: el almacen de la barra persiste; sin almacen NO rompe. */

export const conAlmacen = (celdas: Record<string, string>): void => {
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: {
      getItem: (k: string) => celdas[k] ?? null,
      setItem: (k: string, v: string) => void (celdas[k] = v)
    }
  })
}

export const conAlmacenRoto = (): void => {
  const romper = (): never => {
    throw new Error('bloqueado')
  }
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: { getItem: romper, setItem: romper }
  })
}

afterEach(() => void Reflect.deleteProperty(globalThis, 'localStorage'))

describe('el almacen de la barra', () => {
  it('abierta/cerrada recuerda su ultimo estado', () => {
    conAlmacen({})
    guardarAbierta(false)
    expect(leerAbierta()).toBe(false)
    guardarAbierta(true)
    expect(leerAbierta()).toBe(true)
  })

  it('las carpetas desplegadas sobreviven el ciclo guardar -> leer', () => {
    conAlmacen({})
    guardarExpandidas(['c1', 'c2'])
    expect(leerExpandidas()).toEqual(['c1', 'c2'])
  })

  it('un almacen corrupto no rompe: el arbol arranca plegado', () => {
    conAlmacen({ 'fortress-carpetas-expandidas': '{{{' })
    expect(leerExpandidas()).toEqual([])
    conAlmacen({ 'fortress-carpetas-expandidas': '"no-es-lista"' })
    expect(leerExpandidas()).toEqual([])
  })

  it('sin localStorage NO rompe: abre por defecto, plegada, y guardar calla', () => {
    conAlmacenRoto()
    expect(leerAbierta()).toBe(true)
    expect(leerExpandidas()).toEqual([])
    expect(() => guardarAbierta(false)).not.toThrow()
    expect(() => guardarExpandidas(['c1'])).not.toThrow()
  })
})
