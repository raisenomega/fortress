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
  it('el mismo plan repetido DOS veces: se cierra sin aprobar, con la razon', async () => {
    // Antes cortaba a la PRIMERA repeticion. Ahora le deja una vuelta mas
    // (ADR-097 §5): la respuesta de un modelo no es la misma dos veces, asi que
    // repetir puede dar otra cosa — es la doctrina de `retry-eligibility`, no un
    // cupo de dos disfrazado. A la segunda repetida ya no es mala suerte.
    const r = await hastaAprobarElPlan({
      proponer: () => Promise.resolve('el MISMO texto siempre'),
      juzgar: () => Promise.resolve(REPLANTEA)
    })

    expect(r).toMatchObject({ aprobado: false, razon: 'toca el auth', intentos: 3 })
  })

  it('la segunda oportunidad es UNA: no se renueva en cada repeticion', async () => {
    // Si `yaRepitio` se reseteara, un productor terco daria vueltas para
    // siempre — que es exactamente lo que la huella existe para cortar.
    let vueltas = 0
    await hastaAprobarElPlan({
      proponer: () => (vueltas += 1, Promise.resolve('el MISMO texto siempre')), // prettier-ignore
      juzgar: () => Promise.resolve(REPLANTEA)
    })

    expect(vueltas).toBe(3)
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
