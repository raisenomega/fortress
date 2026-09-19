import { describe, expect, it } from 'vitest'
import { pieDelLote } from './pie-del-lote'

const pie = (over: Partial<Parameters<typeof pieDelLote>[0]> = {}): string =>
  pieDelLote({ enCurso: false, planeado: false, autonomo: false, ...over })

/**
 * ADR-097 §3. La regla que este fichero existe para fijar: EN AUTONOMO NUNCA
 * SALE EL BOTON. Y desde que la puerta del §4 existe no es solo que sobre —
 * pulsarlo mandaba un turno que `guardPlanAprobado` rechaza, uno por hallazgo.
 */
describe('en autonomo no se ofrece el boton', () => {
  it('con el plan escrito y esperando: se DICE que no se aprobo, no se ofrece clic', () => {
    expect(pie({ planeado: true, autonomo: true })).toBe('sin-aprobar')
  })

  it('en NINGUN estado sale «boton» con autonomo puesto', () => {
    const estados = [
      { planeado: true },
      { planeado: false },
      { planeado: true, enCurso: true },
      { planeado: false, enCurso: true }
    ]

    for (const e of estados) expect(pie({ ...e, autonomo: true })).not.toBe('boton')
  })
})

describe('supervisado sigue igual: el Enter del operador aprueba', () => {
  it('con el plan escrito sale el boton, como siempre', () => {
    expect(pie({ planeado: true })).toBe('boton')
  })

  it('sin plan todavia no hay nada que firmar', () => {
    expect(pie({ planeado: false })).toBe('nada')
  })
})

describe('la cola en curso manda sobre todo lo demas', () => {
  it('en los dos modos: lo que importa es que YA corre', () => {
    expect(pie({ enCurso: true, planeado: true })).toBe('ejecutando')
    expect(pie({ enCurso: true, planeado: true, autonomo: true })).toBe('ejecutando')
  })
})
