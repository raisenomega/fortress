import { describe, expect, it } from 'vitest'
import { objecionesComoPedido } from './objeciones-como-pedido'

const UNA = 'El fix no cubre el caso de lista vacia: app.ts:42 sigue reventando con []'
const OTRA = 'Rompe a quien lo llama: el contrato devolvia null y ahora lanza (api.ts:17)'

/**
 * ADR-096 §13.4. El encadenado del DEBATE, que no existe en el camino del
 * escaneo y no debe parecerse a el: alli se resume para no duplicar hallazgos;
 * aqui la prosa entera es lo que el productor tiene que responder.
 */
describe('la objecion del critico llega al productor', () => {
  it('viaja INTEGRA: se responde al razonamiento, no al titular', () => {
    const pedido = objecionesComoPedido([UNA]) ?? ''

    expect(pedido).toContain(UNA)
  })

  it('dice que fue un critico quien lo reviso, y que hay que responder', () => {
    const pedido = objecionesComoPedido([UNA]) ?? ''

    expect(pedido).toContain('CRITICO')
    expect(pedido).toContain('Responde a CADA UNA')
  })

  it('una objecion sin contestar cuenta como aceptada, y se le dice', () => {
    // Sin esto el productor puede ignorar la mitad del tribunal y seguir.
    expect(objecionesComoPedido([UNA])).toContain('sin contestar cuenta como aceptada')
  })
})

describe('el molde nace para N aunque hoy se pruebe con una', () => {
  it('lleva las DOS enteras, numeradas', () => {
    const pedido = objecionesComoPedido([UNA, OTRA]) ?? ''

    expect(pedido).toContain(`[1] ${UNA}`)
    expect(pedido).toContain(`[2] ${OTRA}`)
  })

  it('con varias dice que son INDEPENDIENTES: no es una opinion repetida', () => {
    // ADR-096 §11.3: los criticos no se leen entre si. Tres objeciones distintas
    // pesan lo que tres; el productor tiene que saber que son tres frentes.
    const pedido = objecionesComoPedido([UNA, OTRA]) ?? ''

    expect(pedido).toContain('2 CRITICOS independientes')
    expect(pedido).toContain('sin ver lo que decian los otros')
  })

  it('con una sola no habla en plural: el texto se lee bien en los dos casos', () => {
    const pedido = objecionesComoPedido([UNA]) ?? ''

    expect(pedido).not.toContain('CRITICOS')
    expect(pedido).not.toContain('independientes')
  })
})

describe('sin objeciones no hay reintento que pedir', () => {
  it('devuelve null, NO una cadena vacia', () => {
    // Una cadena vacia dejaria mandarle al productor un mensaje en blanco.
    // `null` obliga a quien llama a decidir, y el tribunal sin objeciones es
    // justamente la senal de que el fix aguanta.
    expect(objecionesComoPedido([])).toBeNull()
  })
})
