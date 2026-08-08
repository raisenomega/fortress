import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { LookupAddress } from 'dns'
import { firstBlocked, safeLookup } from './safe-lookup'

const { lookupMock } = vi.hoisted(() => ({ lookupMock: vi.fn() }))
vi.mock('dns', () => ({ lookup: lookupMock }))

type Respond = (error: Error | null, addresses: LookupAddress[]) => void

const ip = (address: string, family = 4): LookupAddress => ({ address, family })

/** El DNS responde con estas direcciones, sin salir a la red. */
function resolvesTo(...addresses: LookupAddress[]): void {
  lookupMock.mockImplementation((_host: string, _opts: unknown, cb: Respond) => cb(null, addresses))
}

// Cuerpo de bloque a proposito: `mockReset()` devuelve el propio mock, y un
// beforeEach que RETORNA una funcion la ejecuta como teardown — invocaria el
// mock sin argumentos.
beforeEach(() => {
  lookupMock.mockReset()
})

describe('firstBlocked', () => {
  it('detecta el loopback aunque no sea el primer registro', () => {
    expect(firstBlocked([ip('93.184.216.34'), ip('127.0.0.1')])).toBe('127.0.0.1')
  })

  it('detecta los metadatos de la nube', () => {
    expect(firstBlocked([ip('169.254.169.254')])).toBe('169.254.169.254')
  })

  it('desenmascara una IPv4 mapeada en IPv6', () => {
    expect(firstBlocked([ip('::ffff:127.0.0.1', 6)])).toBe('::ffff:127.0.0.1')
  })

  it('deja pasar una IP publica', () => {
    expect(firstBlocked([ip('93.184.216.34')])).toBeNull()
  })
})

describe('safeLookup', () => {
  it('rechaza un dominio publico que resuelve a una IP interna', () => {
    resolvesTo(ip('10.0.0.5'))
    const cb = vi.fn()
    safeLookup('interno.example.com', {}, cb)
    expect(String(cb.mock.calls[0][0])).toContain('10.0.0.5')
  })

  it('rechaza si CUALQUIER registro es interno, no solo el primero', () => {
    resolvesTo(ip('93.184.216.34'), ip('127.0.0.1'))
    const cb = vi.fn()
    safeLookup('rebind.example.com', {}, cb)
    expect(cb.mock.calls[0][0]).toBeInstanceOf(Error)
  })

  it('devuelve la MISMA resolucion validada: una sola consulta al DNS', () => {
    resolvesTo(ip('93.184.216.34'))
    const cb = vi.fn()
    safeLookup('ejemplo.com', { all: true }, cb)
    expect(cb).toHaveBeenCalledWith(null, [ip('93.184.216.34')])
    expect(lookupMock).toHaveBeenCalledTimes(1)
  })

  it('respeta la forma sin `all`: direccion y familia', () => {
    resolvesTo(ip('93.184.216.34'))
    const cb = vi.fn()
    safeLookup('ejemplo.com', {}, cb)
    expect(cb).toHaveBeenCalledWith(null, '93.184.216.34', 4)
  })
})
