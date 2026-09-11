import { describe, expect, it } from 'vitest'
import { COMPLETO } from './informe-fixture'
import { componerInforme } from './informe-de-auditoria'
import { MODULOS_AUDITORIA } from './modulo-auditoria'

const informe = componerInforme(COMPLETO)

describe('el informe transcribe lo que se decidio, no lo recalcula', () => {
  it('la cabecera lleva proyecto y fecha', () => {
    expect(informe).toContain('# Auditoria FORTRESS — Health Flow')
    expect(informe).toContain('2026-09-10T20:00:00.000Z')
  })

  it('el veredicto DICE que numero enseña: el del expediente, no el de la corrida', () => {
    expect(informe).toContain('**74/100**, calculado sobre el EXPEDIENTE de 12 hallazgo(s)')
    expect(informe).toContain('lo que esta corrida reporto (2)')
  })

  it('la cobertura trae las DOS cuentas: ficheros y temas', () => {
    expect(informe).toContain('Audito **1730 de 1730** ficheros, en **10 de 10** paradas.')
    expect(informe).toContain('Y **1** modulo(s) tematico(s): M2 DR/BCP.')
  })

  it('los hallazgos van por severidad, con tipo y sitio', () => {
    expect(informe).toContain('### CRITICAL (1)')
    expect(informe).toContain('`src/pay/charge.ts:42`')
    expect(informe.indexOf('### CRITICAL')).toBeLessThan(informe.indexOf('### LOW'))
  })

  it('es determinista: los mismos datos dan el mismo documento', () => {
    expect(componerInforme(COMPLETO)).toBe(informe)
  })
})

describe('la campaña sale ENTERA: lo descartado se declara', () => {
  it.each(MODULOS_AUDITORIA)('%s aparece con su veredicto', (modulo) => {
    expect(informe).toContain(`**${modulo} `)
  })

  it('un modulo descartado dice NO APLICA y transcribe su razon con la cita', () => {
    expect(informe).toContain('**M8 Integridad de negocio**: NO APLICA')
    expect(informe).toContain('src/index.ts:1')
  })

  it('uno sin constancia dice NO CONSTA, que no es lo mismo', () => {
    expect(informe).toContain('**M3 Privacidad**: NO CONSTA')
  })

  it('y el que aplicaba sin plantilla sembrada lo confiesa', () => {
    expect(informe).toContain(
      '**M9 Accesibilidad**: APLICA — auditado con la checklist base; su plantilla no estaba sembrada' // prettier-ignore
    )
  })

  it('el que si la tuvo lo dice tambien', () => {
    expect(informe).toContain('**M2 DR/BCP**: APLICA — auditado con su plantilla')
  })
})
