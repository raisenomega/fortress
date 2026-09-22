import { describe, expect, it } from 'vitest'
import { retipar, type FilaOtro } from './retipado-de-otros'

// prettier-ignore
const fila = (id: string, o: Partial<FilaOtro> = {}): FilaOtro => ({ id, file: 'src/components/LoginForm.tsx', line: 60, title: 'Formulario de login con labels no asociados', severity: 'HIGH', identity: 'src/components/LoginForm.tsx|60|otro', simbolo: 'LoginForm', firstSeen: '2026-09-06T00:00:00.000Z', ...o })

describe('retipar: cada otro recibe el tipo del juicio, o sigue otro si el agente lo dice', () => {
  it('una fila recibe el tipo del juicio y con el su identidad de hoy (el fichero, en minusculas, como siempre)', () => {
    const [r] = retipar([fila('a')], [{ id: 'a', tipo: 'accesibilidad', razon: 'labels sin for' }])
    expect(r).toMatchObject({ id: 'a', desenlace: 'retipada', tipo: 'accesibilidad', identidad_nueva: 'src/components/loginform.tsx|60|accesibilidad', razon: 'labels sin for' }) // prettier-ignore
  })

  it('un otro que era un tipo de seguridad mal puesto vuelve a su clase', () => {
    const [r] = retipar([fila('a', { file: 'f/send-invoice/index.ts', line: 268 })], [{ id: 'a', tipo: 'rate-limit-ausente' }]) // prettier-ignore
    expect(r).toMatchObject({ desenlace: 'retipada', tipo: 'rate-limit-ausente', identidad_nueva: 'f/send-invoice/index.ts|268|rate-limit-ausente' }) // prettier-ignore
  })

  it('si el agente dice otro, sigue otro: no se fuerza un tipo que no es', () => {
    const [r] = retipar([fila('a')], [{ id: 'a', tipo: 'otro', razon: 'no encaja en ninguno' }])
    expect(r).toEqual({
      id: 'a',
      desenlace: 'sigue_otro',
      razon: 'no encaja en ninguno',
      nota: null
    })
  })

  it('un tipo fuera del vocabulario no se inventa: sigue otro, y se dice', () => {
    const [r] = retipar([fila('a')], [{ id: 'a', tipo: 'calidad-de-codigo' }])
    expect(r).toMatchObject({ desenlace: 'sigue_otro', nota: 'tipo fuera del vocabulario: calidad-de-codigo' }) // prettier-ignore
  })

  it('sin respuesta, o con el tipo ilegible, no se decide y se dice', () => {
    const [sin, mal] = retipar([fila('a'), fila('b')], [{ id: 'b', tipo: 7 }])
    expect(sin).toEqual({ id: 'a', desenlace: 'sin_decidir', motivo: 'sin respuesta del agente' })
    expect(mal).toMatchObject({ id: 'b', desenlace: 'sin_decidir' })
  })
})
