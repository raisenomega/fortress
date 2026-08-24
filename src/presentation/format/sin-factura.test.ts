import { describe, expect, it } from 'vitest'
import { NADA_SIN_MEDIR } from '@domain/telemetry/sin-factura'
import { detalleSinMedir, fraseSinMedir } from './sin-factura'

const DOS = { runs: 2, durationMs: 1_800_118 }

describe('el pie dice cuantas corridas no pudo medir', () => {
  it('con dos sin medir: cuantas son y cuanto tiempo real gastaron', () => {
    expect(fraseSinMedir(DOS)).toBe('2 sin medir (30m 00s)')
  })

  it('con ninguna NO dice nada: null, no una cadena vacia', () => {
    // El pie se ve desde todas las pantallas. Cuando todo esta medido no hay
    // nada que advertir, y anadir ruido gastaria la linea que compite con el
    // total. Es la misma forma que `formatCost`, que devuelve null y no "$0.00".
    expect(fraseSinMedir(NADA_SIN_MEDIR)).toBeNull()
  })

  it('nunca ofrece una cifra de dinero: el que falta no existe', () => {
    expect(fraseSinMedir(DOS)).not.toContain('$')
  })
})

describe('Rendimiento lo dice entero, que ahi hay sitio', () => {
  it('nombra el coste como DESCONOCIDO y avisa de que no entra en el total', () => {
    const texto = detalleSinMedir(DOS)

    expect(texto).toContain('2 corridas sin factura')
    expect(texto).toContain('30m 00s')
    expect(texto).toContain('coste desconocido')
    expect(texto).toContain('No entran en las cifras de arriba')
  })

  it('una sola corrida se dice en singular', () => {
    expect(detalleSinMedir({ runs: 1, durationMs: 900_018 })).toContain('1 corrida sin factura')
  })

  it('con ninguna tampoco dice nada', () => {
    expect(detalleSinMedir(NADA_SIN_MEDIR)).toBeNull()
  })

  it('tampoco aqui se estima el dinero', () => {
    expect(detalleSinMedir(DOS)).not.toContain('$')
  })
})
