import { describe, expect, it } from 'vitest'
import { resumenDelLote } from './parte-del-lote'

const BARRERA = { puerta: 'barrera', motivo: 'La barrera no puede arrancar.' } as const

describe('el parte del lote dice POR QUE no corrio, y queda escrito', () => {
  // Medido el 2026-09-21: el fail-closed nego tres ejecuciones y lo unico que
  // quedo en el hilo fue «3 no cerraron (degradaron, revirtieron o sin cambios)».
  // Ninguna de esas tres causas era la real, y el aviso de pantalla muere al
  // reiniciar. Un bloqueo que no deja constancia es un recibo a medias.
  it('negado a la primera: nada se proceso, y dice que puerta y con que palabras', () => {
    expect(resumenDelLote(['negado'], 3, [], 0, BARRERA)).toBe(
      'Lote: 0 de 3 procesados — 0 a Historia, 0 siguen activos, 0 sin prueba, ' +
        '0 pendientes de verificar, 0 no cerraron (degradaron, revirtieron o sin cambios). ' +
        'NEGADO por la barrera del proyecto, antes de empezar el turno: La barrera no puede arrancar. ' +
        'Cortado: 3 sin lanzar.'
    )
  })

  it('negado a mitad: lo ya hecho cuenta, y el negado NO cuenta como procesado', () => {
    const parte = resumenDelLote(['extinguido', 'negado'], 3, [], 0, BARRERA)
    expect(parte).toContain('Lote: 1 de 3 procesados — 1 a Historia')
    expect(parte).toContain('Cortado: 2 sin lanzar.')
  })

  it.each([
    ['plan-sin-aprobar', 'el plan sin aprobar'],
    ['carril', 'la guarda del carril']
  ] as const)('la puerta %s se nombra', (puerta, etiqueta) => {
    expect(resumenDelLote(['negado'], 1, [], 0, { puerta, motivo: 'm' })).toContain(`NEGADO por ${etiqueta}`) // prettier-ignore
  })

  it('SIN negativa el parte es byte a byte el de siempre', () => {
    expect(resumenDelLote(['no_cerro', 'no_cerro', 'no_cerro'], 3)).toBe(
      'Lote: 3 de 3 procesados — 0 a Historia, 0 siguen activos, 0 sin prueba, ' +
        '0 pendientes de verificar, 3 no cerraron (degradaron, revirtieron o sin cambios).'
    )
  })
})
