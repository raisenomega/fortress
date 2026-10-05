import { describe, expect, it } from 'vitest'
import { juzgarModelo } from './guardia-del-modelo'

/**
 * El guardian del modelo REAL (ADR-078, enmienda 2026-10-05): lo que el CLI o
 * la API dicen que corrio, contra lo que se pidio. `usados` va con el PRINCIPAL
 * primero (el de mas salida): el CLI usa modelos auxiliares por debajo y un
 * haiku de servicio no es «el agente corrio en haiku».
 */
describe('el guardian juzga el modelo que de verdad corrio', () => {
  it('Fable → FALLA, aunque sea auxiliar: prohibido por doctrina (ADR-088 Enm. 3)', () => {
    expect(juzgarModelo('opus', ['claude-fable-5'])).toMatchObject({ veredicto: 'falla' })
    expect(juzgarModelo('opus', ['claude-opus-5-5', 'claude-fable-5-1'])).toMatchObject({ veredicto: 'falla' })
  })

  it('opus pedido y sonnet o haiku de principal → FALLA: por debajo del tier', () => {
    expect(juzgarModelo('opus', ['claude-sonnet-5-5'])).toMatchObject({ veredicto: 'falla' })
    expect(juzgarModelo('opus', ['claude-haiku-4-5-20251001'])).toMatchObject({ veredicto: 'falla' })
  })

  it('un opus mas viejo junto al nuevo (fallback) → AVISA y sigue: nunca falla', () => {
    const j = juzgarModelo('opus', ['claude-opus-5-5', 'claude-opus-4-8'])
    expect(j.veredicto).toBe('aviso')
    expect(j.motivo).toMatch(/claude-opus-4-8/)
  })

  it('lo pedido, con un haiku auxiliar por debajo → OK, y registra el principal', () => {
    expect(juzgarModelo('opus', ['claude-opus-5-5', 'claude-haiku-4-5'])).toEqual({ veredicto: 'ok', modelo: 'claude-opus-5-5' }) // prettier-ignore
  })

  it('pedir sonnet y recibir opus no es falla: por encima del tier', () => {
    expect(juzgarModelo('sonnet', ['claude-opus-5-5'])).toMatchObject({ veredicto: 'ok' })
  })

  it('sin dato del CLI (murio antes del modelo) → ok sin modelo: no se inventa', () => {
    expect(juzgarModelo('opus', [])).toEqual({ veredicto: 'ok', modelo: null })
  })
})
