import { describe, expect, it } from 'vitest'
import { esAveria } from '@domain/repair/averia'
import { isRetryable } from '@domain/repair/retry-eligibility'
import { isRejectionReason } from '@domain/repair/repair-rejection'
import { motivoDelGenerador } from './motivo-del-generador'

describe('cada fallo del generador muere con su propio nombre', () => {
  it('nuestro reloj se agota: generator_timeout, no una averia ajena', () => {
    expect(motivoDelGenerador({ timedOut: true })).toBe('generator_timeout')
  })

  it('el CLI sale con codigo de error: provider_error', () => {
    expect(motivoDelGenerador({})).toBe('provider_error')
  })

  it('los turnos ganan al reloj: el hecho mas especifico manda', () => {
    // Una corrida que agota sus vueltas puede tardar tanto que el plazo la
    // alcance. Decir "se acabo el tiempo" mandaria a subir el plazo, que no
    // arregla nada: lo que se acabo fueron las vueltas.
    expect(motivoDelGenerador({ turnosAgotados: true, timedOut: true })).toBe('turnos_agotados')
  })

  it('los tres son motivos del dominio, no cadenas sueltas', () => {
    for (const fallo of [{ timedOut: true as const }, {}, { turnosAgotados: true as const }]) {
      expect(isRejectionReason(motivoDelGenerador(fallo))).toBe(true)
    }
  })
})

describe('el trato que cada nombre recibe, que es el porque de partirlo', () => {
  it('el reloj: ni corta la tanda ni se reintenta', () => {
    // Repetir contra el mismo plazo, sin cambiar nada, daria lo mismo — es lo
    // que la doctrina D24 ya decia por escrito mientras la lista la contradecia.
    expect(esAveria('generator_timeout')).toBe(false)
    expect(isRetryable('RECHAZADO', 'generator_timeout')).toBe(false)
  })

  it('el proveedor: corta la tanda Y se reintenta', () => {
    // Un 429 o un corte de red se arreglan esperando, y no dicen nada del fix.
    expect(esAveria('provider_error')).toBe(true)
    expect(isRetryable('RECHAZADO', 'provider_error')).toBe(true)
  })
})
