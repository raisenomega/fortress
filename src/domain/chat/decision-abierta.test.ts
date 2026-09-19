import { describe, expect, it } from 'vitest'
import { DECISION_ABIERTA, parteDeDecisionAbierta } from './decision-abierta'

const parte = parteDeDecisionAbierta(5, 4)

/**
 * ADR-097 §3. El texto con el que el autonomo admite su limite. Se prueba el
 * TEXTO y no solo que exista, porque el fallo que este arco evita no es que
 * falte el aviso: es que el aviso este y nadie lo entienda.
 */
describe('lo dice en cristiano, no en jerga', () => {
  it('dice literalmente que necesita un humano', () => {
    expect(parte).toContain('necesita un humano')
    expect(DECISION_ABIERTA).toContain('necesita un humano')
  })

  it('NO dice «no convergio» ni ninguna otra palabra de dentro', () => {
    // «no convergio» es como se llama el fallo en el codigo. Al operador no le
    // dice ni que paso ni que falta: solo que algo tecnico salio mal.
    expect(parte).not.toMatch(/converg|huella|veredicto|REPLANTEA|null/i)
  })

  it('dice QUE paso y QUE falta, en ese orden', () => {
    // Primero que nadie toco su codigo —es lo que mas urge saber—, y luego que
    // se espera de el. Un aviso que solo dice «no pude» deja al operador sin
    // saber si tiene que revisar algo.
    expect(parte).toContain('4 vueltas')
    expect(parte).toContain('No se ha ejecutado nada')
    expect(parte).toContain('Dime tu por donde empezar')
  })

  it('cuenta cuantos hallazgos siguen abiertos, y concuerda', () => {
    expect(parte).toContain('5 hallazgos siguen abiertos')
    expect(parteDeDecisionAbierta(1, 1)).toContain('1 hallazgo sigue abierto')
    expect(parteDeDecisionAbierta(1, 1)).toContain('una vuelta')
  })
})

describe('no se lleva nada del proyecto auditado', () => {
  it('ni la razon de OMEGA, ni el plan, ni rutas: solo numeros', () => {
    // La misma linea que respeta `MotivoSinCierre` por ser un enum. Lo que se
    // persiste en el hilo puede acabar en un export, y el codigo del cliente no.
    expect(parte).not.toMatch(/\.ts|\.py|\/|auth|sink/)
  })
})
