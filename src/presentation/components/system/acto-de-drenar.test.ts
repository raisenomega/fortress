import { describe, expect, it } from 'vitest'
import { actoDeDrenar, avisosDelDrenaje } from './acto-de-drenar'

const TOPES = { elegibles: 3, costCapUsd: '$25', maxVueltas: '6' }

describe('actoDeDrenar', () => {
  it('con elegibles pregunta antes de arrancar, no arranca', () => {
    expect(actoDeDrenar(false, 3)).toBe('preguntar')
  })

  it('sin elegibles lo dice en vez de arrancar en vano', () => {
    expect(actoDeDrenar(false, 0)).toBe('nada-que-drenar')
  })

  it('drenando el mismo boton para, sin preguntar', () => {
    expect(actoDeDrenar(true, 3)).toBe('parar')
  })

  it('drenando para aunque ya no queden elegibles', () => {
    // Parar es una orden sobre lo que corre AHORA: si dependiera del contador
    // de pendientes, el ultimo hallazgo de la tanda dejaria el boton mudo.
    expect(actoDeDrenar(true, 0)).toBe('parar')
  })
})

describe('avisosDelDrenaje', () => {
  it('dice cuantos hallazgos trabajara, con el numero real', () => {
    expect(avisosDelDrenaje(TOPES).trabajo).toContain('hasta 3 hallazgos')
  })

  it('concuerda en singular con un solo elegible', () => {
    const avisos = avisosDelDrenaje({ ...TOPES, elegibles: 1 })
    expect(avisos.trabajo).toContain('hasta 1 hallazgo:')
  })

  it('dice los dos topes: gasto y vueltas', () => {
    expect(avisosDelDrenaje(TOPES).topes).toContain('$25')
    expect(avisosDelDrenaje(TOPES).topes).toContain('6 vueltas')
  })

  it('lleva los topes reales, no unos fijos', () => {
    const otros = avisosDelDrenaje({ ...TOPES, costCapUsd: '$3', maxVueltas: '2' })
    expect(otros.topes).toContain('$3')
    expect(otros.topes).toContain('2 vueltas')
    expect(otros.topes).not.toContain('$25')
  })

  it('garantiza que nada se integra sin firma', () => {
    expect(avisosDelDrenaje(TOPES).garantia).toContain('sin tu firma')
    expect(avisosDelDrenaje(TOPES).garantia).toContain('antes del merge')
  })

  it('avisa de firmar a mitad del drenaje', () => {
    const orden = avisosDelDrenaje(TOPES).orden
    expect(orden).toContain('drenar, parar y firmar')
    expect(orden).toContain('caducan')
  })
})
