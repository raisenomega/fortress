import { afterEach, describe, expect, it, vi } from 'vitest'
import * as cadena from './run-motor-chain'
import { CTX, deps } from './drenar-fixture'
import { drenarHastaOmega } from './drenar-hasta-omega'

afterEach(() => vi.restoreAllMocks())

/** El escenario exacto del 05-oct: el primer hallazgo cae por la cuota. La
 *  tanda tiene que PARAR ahi, no elegir los ocho siguientes dos veces cada uno. */
describe('el drenaje para en el PRIMER 429', () => {
  it('provider_error del primer hallazgo → fin averia, sin tocar un segundo', async () => {
    const espia = vi.spyOn(cadena, 'runMotorChain').mockResolvedValue({ ok: false, error: 'provider_error' })
    const r = await drenarHastaOmega(CTX, 'p1', deps())
    expect(r.fin).toBe('averia')
    expect(r.detalle).toBe('provider_error')
    expect(espia).toHaveBeenCalledTimes(1)
  })
})
