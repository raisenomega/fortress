import { beforeEach, describe, expect, it, vi } from 'vitest'
import { runMotorChain } from './run-motor-chain'
import { ctx, DEPS, elige } from './run-motor-chain-fixture'

beforeEach(() => void vi.restoreAllMocks())

/**
 * La rafaga del 2026-10-05: la cuota del modelo se agoto a las 01:11 y el
 * analista rechazo cada propuesta por el proveedor — pero la cadena devolvia
 * `obsoleto` para TODO rechazo del analisis, asi que el drenaje siguio y quemo
 * la baraja entera (16 rechazos en 40 s). Una averia del analisis tiene que
 * salir como averia, igual que la del generador.
 */
describe('runMotorChain: la averia del ANALISTA corta, como la del generador', () => {
  it('rechazo del analista por el proveedor → error provider_error, no obsoleto', async () => {
    elige({ id: 'prop-1', state: 'RECHAZADO', analysisReason: "provider_error: 429: You've reached your Fable limit" }) // prettier-ignore
    expect(await runMotorChain(ctx(), 'proj', DEPS)).toEqual({ ok: false, error: 'provider_error' })
  })

  it('el CLI que no arranco en el analisis tambien corta (su doctrina ya lo decia)', async () => {
    elige({ id: 'prop-1', state: 'RECHAZADO', analysisReason: 'cli_no_arranco: ENOENT claude' })
    expect(await runMotorChain(ctx(), 'proj', DEPS)).toEqual({ ok: false, error: 'cli_no_arranco' })
  })

  it('un rechazo de analisis que NO es averia sigue como antes: obsoleto, la tanda sigue', async () => {
    elige({ id: 'prop-1', state: 'RECHAZADO', analysisReason: 'analisis_ilegible: }]' })
    expect(await runMotorChain(ctx(), 'proj', DEPS)).toEqual({ ok: true, value: { kind: 'obsoleto', proposalId: 'prop-1' } }) // prettier-ignore
  })
})
