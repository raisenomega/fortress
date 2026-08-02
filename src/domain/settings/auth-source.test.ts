import { describe, expect, it } from 'vitest'
import { parseAuthSource } from './auth-source'

describe('parseAuthSource', () => {
  it('por defecto la suscripcion, no la API key', () => {
    // Al reves, cualquiera que pegara una key se quedaba pagando sin saberlo.
    expect(parseAuthSource(null)).toBe('suscripcion')
    expect(parseAuthSource('')).toBe('suscripcion')
  })

  it('respeta la eleccion explicita de facturar a la key', () => {
    expect(parseAuthSource('api-key')).toBe('api-key')
  })

  it('un valor corrupto cae del lado que no cuesta dinero', () => {
    expect(parseAuthSource('lo-que-sea')).toBe('suscripcion')
  })
})
