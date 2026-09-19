import { describe, expect, it } from 'vitest'
import type { JuicioDelPlan } from '@domain/chat/juicio-del-plan'
import { hastaAprobarElPlan } from './ciclo-del-plan'

const ADELANTE: JuicioDelPlan = {
  ataca_la_causa: 'SI',
  declara_tocar_lo_intocable: 'NO',
  alcance: 'AJUSTADO',
  veredicto: 'ADELANTE',
  razon: 'va a la causa'
}
const REPLANTEA: JuicioDelPlan = { ...ADELANTE, veredicto: 'REPLANTEA', razon: 'toca el auth' }

/**
 * ADR-097 §5. Cuando el ciclo del plan PARA: por huella repetida o porque OMEGA
 * no llego a juzgar. Aparte del fichero de «aprobar/replantear» porque son dos
 * preguntas —como avanza y como termina— y juntas pasaban de 75 lineas.
 */
describe('la huella caza al que da vueltas', () => {
  it('el mismo plan dos veces: se cierra sin aprobar, con la razon', async () => {
    const r = await hastaAprobarElPlan({
      proponer: () => Promise.resolve('el MISMO texto siempre'),
      juzgar: () => Promise.resolve(REPLANTEA)
    })

    expect(r).toMatchObject({ aprobado: false, razon: 'toca el auth', intentos: 2 })
  })

  it('converger no es un contador: mientras el texto CAMBIE, sigue', async () => {
    let n = 0
    const r = await hastaAprobarElPlan({
      proponer: () => Promise.resolve(`plan distinto ${++n}`),
      juzgar: () => Promise.resolve(n >= 4 ? ADELANTE : REPLANTEA)
    })

    expect(r).toMatchObject({ aprobado: true, intentos: 4 })
  })
})

describe('si OMEGA no juzga, NO se inventa una aprobacion', () => {
  it('sale sin aprobar y sin razon: decide quien llama', async () => {
    const r = await hastaAprobarElPlan({
      proponer: () => Promise.resolve('un plan'),
      juzgar: () => Promise.resolve(null)
    })

    expect(r).toMatchObject({ aprobado: false, razon: null, intentos: 1 })
  })
})
