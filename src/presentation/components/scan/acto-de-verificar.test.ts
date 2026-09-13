import { describe, expect, it } from 'vitest'
// prettier-ignore
import { actoDeVerificar, avisosDeLaVerificacion, costeEstimado, duracionEstimada } from './acto-de-verificar'

describe('el gasto se autoriza, no se dispara con un clic', () => {
  it('parado y con mitigados: PREGUNTA, no arranca', () => {
    // La confirmacion no es opcional: este gesto no lleva techo de gasto, asi
    // que ese dialogo es lo unico que hay entre el clic y la factura.
    expect(actoDeVerificar(false, 26)).toBe('preguntar')
  })

  it('parado y sin mitigados: lo dice, no arranca un barrido sin a quien atender', () => {
    expect(actoDeVerificar(false, 0)).toBe('nada-que-verificar')
  })

  it('verificando: el mismo boton para, y parar no depende de cuantos queden', () => {
    expect(actoDeVerificar(true, 26)).toBe('parar')
    expect(actoDeVerificar(true, 0)).toBe('parar')
  })
})

describe('lo que el operador lee antes de autorizar', () => {
  it('dice cuantos, cuanto cuesta y cuanto tarda, con cifras medidas', () => {
    const avisos = avisosDeLaVerificacion(26)

    expect(avisos.trabajo).toContain('26 mitigados')
    expect(avisos.coste).toContain('$60')
    expect(avisos.coste).toContain('2h49m')
  })

  it('y dice EXPRESAMENTE que no hay tope de gasto: es la mitad del trato', () => {
    // Con un tope detras, un clic de mas se paga caro pero acotado. Sin el, el
    // operador tiene que saberlo ANTES, no descubrirlo en la factura.
    expect(avisosDeLaVerificacion(26).coste).toContain('NO hay tope de gasto')
    expect(avisosDeLaVerificacion(26).parada).toContain('el siguiente no arranca')
  })

  it('promete que nada muere sin prueba: es lo que hace seguro autorizarlo', () => {
    expect(avisosDeLaVerificacion(26).garantia).toContain('Nada muere sin prueba')
  })

  it('uno solo se dice en singular: «1 mitigado», no «1 mitigados»', () => {
    expect(avisosDeLaVerificacion(1).trabajo).toContain('1 mitigado ')
  })
})

describe('las cifras estimadas salen de corridas reales', () => {
  it('menos de una hora se dice en minutos, no en «0h»', () => {
    expect(duracionEstimada(4)).toBe('26m')
  })

  it('y a partir de la hora, con los minutos a dos digitos', () => {
    expect(duracionEstimada(10)).toBe('1h05m')
    expect(costeEstimado(10)).toBe('$23')
  })
})
