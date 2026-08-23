import { afterEach, describe, expect, it, vi } from 'vitest'
import { CTX, deps, espera, motor } from './drenar-fixture'
import * as cadena from './run-motor-chain'
import { drenarHastaOmega } from './drenar-hasta-omega'

afterEach(() => vi.restoreAllMocks())

describe('los frenos del drenaje', () => {
  it('para al tope de vueltas sin agotar el pozo', async () => {
    motor(espera('a'), espera('b'), espera('c'), espera('d'))
    const r = await drenarHastaOmega(CTX, 'p1', deps({ maxVueltas: 2 }))
    expect(r).toMatchObject({ fin: 'tope-vueltas', acumuladas: 2 })
  })

  it('el tope de gasto corta antes de la primera vuelta', async () => {
    const espia = motor(espera('a'))
    const r = await drenarHastaOmega(CTX, 'p1', deps({ gastado: () => 25 }))
    expect(r.fin).toBe('tope-gasto')
    expect(espia).not.toHaveBeenCalled()
  })
})

describe('una parada humana es una parada, no una averia', () => {
  it('cancelar A MITAD de una vuelta se registra como detenido', async () => {
    // Parar mata al hijo y el hijo muriendo devuelve un error que, clasificado
    // a ciegas, parece del proveedor. Esto es lo que impedia distinguir "el
    // operador dijo basta" de "el sistema se rompio".
    let yaCorrio = false
    vi.spyOn(cadena, 'runMotorChain').mockImplementation(() => {
      yaCorrio = true
      return Promise.resolve({ ok: false, error: 'el proceso termino con codigo 143' })
    })

    const r = await drenarHastaOmega(CTX, 'p1', deps({ cancelado: () => yaCorrio }))

    expect(r.fin).toBe('detenido')
    expect(r.detalle).toBeUndefined()
  })

  it('un fallo real SIN cancelacion si es averia, con su detalle', async () => {
    vi.spyOn(cadena, 'runMotorChain').mockResolvedValue({ ok: false, error: 'overloaded' })
    expect(await drenarHastaOmega(CTX, 'p1', deps())).toMatchObject({
      fin: 'averia',
      detalle: 'overloaded'
    })
  })
})
