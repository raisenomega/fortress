import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const fuente = (ruta: string): string => readFileSync(join(process.cwd(), 'src', ruta), 'utf8')
const HANDLER = fuente('infrastructure/ipc/chat-send-handler.ts')

/**
 * Las TRES puertas de `chat:send` niegan con su nombre, y el turno que revienta
 * sigue siendo un `err` a secas. La diferencia es la que deja a la cola del lote
 * cortar ante una puerta —la negativa es del lote, no del hallazgo— sin cortar
 * por la averia de un turno, que si es de ese hallazgo y no de los demas.
 *
 * De fuente y no de comportamiento: `atenderEnvio` no se exporta y levanta el
 * contexto de Electron. El comportamiento de cada pieza tiene su test aparte.
 */
describe('cada puerta del envio niega con su nombre', () => {
  it.each([
    ['barrera', /if \(rota !== null\) return negado\('barrera', rota\)/],
    [
      'plan-sin-aprobar',
      /if \(sinAprobar !== null\) return negado\('plan-sin-aprobar', sinAprobar\)/
    ],
    ['carril', /if \(denegado !== null\) return negado\('carril', denegado\)/]
  ])('%s', (_puerta, cableado) => {
    expect(HANDLER).toMatch(cableado)
  })

  it('ninguna puerta vuelve ya como un `err` anonimo', () => {
    expect(HANDLER).not.toMatch(/return err\((rota|sinAprobar|denegado)\)/)
  })

  it('un turno que REVIENTA no es una negativa: sigue siendo err', () => {
    expect(HANDLER).toMatch(/return err\(describeAssistantError\(error\)\)/)
  })

  it('y el renderer lee los tres caminos del mismo sitio', () => {
    expect(fuente('presentation/services/chat-service.ts')).toContain(
      'desenlace = desenlaceDelResultado(result)'
    )
  })
})
