import { afterEach, describe, expect, it } from 'vitest'
import { guardarAbierta, leerAbierta, useBarraStore } from './barra-store'

/** PASO 116: abrir/cerrar persiste en localStorage; sin almacen NO rompe. */

const conAlmacen = (celdas: Record<string, string>): void => {
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: {
      getItem: (k: string) => celdas[k] ?? null,
      setItem: (k: string, v: string) => void (celdas[k] = v)
    }
  })
}

const conAlmacenRoto = (): void => {
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: {
      getItem: () => {
        throw new Error('bloqueado')
      },
      setItem: () => {
        throw new Error('bloqueado')
      }
    }
  })
}

afterEach(() => void Reflect.deleteProperty(globalThis, 'localStorage'))

describe('el toggle de la barra', () => {
  it('recuerda su ultimo estado en localStorage', () => {
    const celdas: Record<string, string> = {}
    conAlmacen(celdas)
    guardarAbierta(false)
    expect(leerAbierta()).toBe(false)
    guardarAbierta(true)
    expect(leerAbierta()).toBe(true)
  })

  it('toggle voltea el estado y lo persiste', () => {
    const celdas: Record<string, string> = {}
    conAlmacen(celdas)
    useBarraStore.setState({ abierta: true })
    useBarraStore.getState().toggle()
    expect(useBarraStore.getState().abierta).toBe(false)
    expect(celdas['fortress-barra-del-chat']).toBe('cerrada')
  })

  it('sin localStorage NO rompe: abre por defecto y guardar calla', () => {
    conAlmacenRoto()
    expect(leerAbierta()).toBe(true)
    expect(() => guardarAbierta(false)).not.toThrow()
  })
})
