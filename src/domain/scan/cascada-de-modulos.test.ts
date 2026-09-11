import { describe, expect, it } from 'vitest'
import { con, NADA } from './evidencia-fixture'
import { MODULOS_AUDITORIA } from './modulo-auditoria'
import { modulosAplicables } from './modulos-aplicables'
import { MODULOS_SIEMPRE } from './modulos-siempre'

const modulosDe = (r: ReadonlyArray<{ modulo: string }>): readonly string[] =>
  r.map((x) => x.modulo)

describe('el nucleo aplica siempre: sin senal, sin declaracion, sin juicio', () => {
  it.each(MODULOS_SIEMPRE)('%s aplica en un proyecto vacio', (modulo) => {
    expect(modulosAplicables(NADA).aplicables).toContain(modulo)
  })

  it('y nada los saca de ahi por falta de senal', () => {
    const { descartados, sinConstancia } = modulosAplicables(NADA)

    for (const modulo of MODULOS_SIEMPRE) {
      expect(modulosDe(descartados)).not.toContain(modulo)
      expect(modulosDe(sinConstancia)).not.toContain(modulo)
    }
  })

  it('los doce tienen hogar: cierra clasificar-modulos-sin-senal', () => {
    const { aplicables, descartados, sinConstancia } = modulosAplicables(NADA)

    expect(aplicables.length + descartados.length + sinConstancia.length).toBe(
      MODULOS_AUDITORIA.length
    )
  })
})

describe('la senal de pago es de UN SOLO SENTIDO', () => {
  it('con stripe declarado, M8 aplica sin juicio ninguno', () => {
    expect(modulosAplicables(con(['package.json'], ['stripe'])).aplicables).toContain('M8')
  })

  it.each(['@stripe/stripe-js', 'braintree', 'paypal-rest-sdk', 'mercadopago'])(
    '%s tambien lo delata',
    (dep) => {
      expect(modulosAplicables(con([], [dep])).aplicables).toContain('M8')
    }
  )

  it('SIN pasarela, M8 NO se descarta: baja al juicio, no a descartado', () => {
    const { descartados, sinConstancia } = modulosAplicables(con(['package.json']))

    expect(modulosDe(descartados)).not.toContain('M8')
    expect(modulosDe(sinConstancia)).toContain('M8')
  })
})
