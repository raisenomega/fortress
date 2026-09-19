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
 * ADR-097 §5. El ciclo del plan: hermano del ciclo del fix, SIN red de
 * reversion —un plan no edita— y con la huella sobre el TEXTO, porque el texto
 * es la propuesta.
 */
describe('el plan se aprueba o se replantea', () => {
  it('aprobado a la primera: una vuelta y adelante', async () => {
    const r = await hastaAprobarElPlan({
      proponer: () => Promise.resolve('borro el sink'),
      juzgar: () => Promise.resolve(ADELANTE)
    })

    expect(r).toMatchObject({ aprobado: true, intentos: 1, razon: null })
  })

  it('denegado: el productor REPROPONE con la objecion, y lo segundo se aprueba', async () => {
    const pedidos: (string | null)[] = []
    let vuelta = 0

    const r = await hastaAprobarElPlan({
      proponer: (replanteo) => {
        pedidos.push(replanteo)
        return Promise.resolve(`intento ${pedidos.length}`)
      },
      juzgar: () => Promise.resolve(++vuelta === 1 ? REPLANTEA : ADELANTE)
    })

    expect(r).toMatchObject({ aprobado: true, intentos: 2 })
    expect(pedidos[0]).toBeNull()
    // La objecion literal viaja al productor, no un resumen.
    expect(pedidos[1]).toContain('toca el auth')
  })

  it('el replanteo le recuerda que NO toco nada: no hay que defender un fix', async () => {
    const pedidos: (string | null)[] = []
    let vuelta = 0
    await hastaAprobarElPlan({
      proponer: (r) => (pedidos.push(r), Promise.resolve(`intento ${pedidos.length}`)),
      juzgar: () => Promise.resolve(++vuelta === 1 ? REPLANTEA : ADELANTE)
    })

    expect(pedidos[1]).toContain('No has tocado ningun fichero')
  })
})
