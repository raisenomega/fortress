import { describe, expect, it } from 'vitest'
import { ordenarPorSensibilidad } from './prioridad-de-paradas'

const parada = (carpeta: string): { carpeta: string; ficheros: string[] } => ({
  carpeta,
  ficheros: [`${carpeta}/a.ts`]
})

const orden = (...carpetas: string[]): readonly string[] =>
  ordenarPorSensibilidad(carpetas.map(parada)).map((p) => p.carpeta)

describe('las zonas sensibles se auditan primero', () => {
  it('auth y payment delante de web y utils', () => {
    expect(orden('web', 'auth', 'utils', 'payment')).toEqual(['auth', 'payment', 'web', 'utils'])
  })

  it('vale a cualquier profundidad: el segmento manda, no la ruta entera', () => {
    expect(orden('src/utils', 'src/auth')).toEqual(['src/auth', 'src/utils'])
    expect(orden('apps/web', 'apps/identity')).toEqual(['apps/identity', 'apps/web'])
  })

  it('por PREFIJO de segmento: authz y payments tambien entran', () => {
    expect(orden('lib', 'authz')).toEqual(['authz', 'lib'])
    expect(orden('lib', 'payments')).toEqual(['payments', 'lib'])
  })

  it('sin falsos positivos por subcadena: controllers no es sensible', () => {
    // Con `includes` sobre la ruta entera, «controllers» encajaria con «rol» y
    // «browser» con «user». Por segmento y por prefijo, no.
    expect(orden('controllers', 'browser', 'auth')).toEqual(['auth', 'controllers', 'browser'])
  })

  it('es una PARTITION estable: dentro de cada mitad manda el manifiesto', () => {
    expect(orden('zeta', 'alfa', 'session')).toEqual(['session', 'zeta', 'alfa'])
  })

  it('cambia el orden, nunca cuantas', () => {
    const cuatro = ['web', 'auth', 'utils', 'payment'].map(parada)

    expect(ordenarPorSensibilidad(cuatro)).toHaveLength(4)
    expect(ordenarPorSensibilidad([])).toEqual([])
  })
})
