import { describe, expect, it } from 'vitest'
import { etiquetaDelLote, pieDelLote } from './pie-del-lote'

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

describe('la cola en curso manda, pero cada modo la cuenta a su manera', () => {
  it('SUPERVISADO INTACTO: la pildora, que es el boton ya pulsado y apagado', () => {
    expect(pie({ enCurso: true, planeado: true })).toBe('ejecutando')
  })

  it('AUTONOMO: texto del lote, NUNCA la pildora verde (BUG 3)', () => {
    // Alli nunca hubo boton que apagar: un verde de «adelante» sobre algo que
    // nadie pulso, fijo el lote entero y sin decir que estaba pasando.
    expect(pie({ enCurso: true, planeado: true, autonomo: true })).toBe('lote-en-curso')
    expect(pie({ enCurso: true, planeado: false, autonomo: true })).toBe('lote-en-curso')
  })

  it('en NINGUN estado sale «ejecutando» con autonomo puesto', () => {
    for (const planeado of [true, false])
      expect(pie({ enCurso: true, planeado, autonomo: true })).not.toBe('ejecutando')
  })
})

describe('el ancla del lote siempre tiene algo que decir', () => {
  it('cuenta el que corre AHORA, no los terminados', () => {
    expect(etiquetaDelLote(0, 3)).toBe('Lote 1 de 3')
    expect(etiquetaDelLote(1, 3)).toBe('Lote 2 de 3')
  })

  it('al cerrar el ultimo NO anuncia uno que no existe', () => {
    expect(etiquetaDelLote(3, 3)).toBe('Lote 3 de 3')
  })

  it('nunca sale vacio: es lo que sostiene el pie entre turno y turno', () => {
    for (const hechos of [0, 1, 2, 3, 9]) expect(etiquetaDelLote(hechos, 3)).not.toBe('')
  })
})
