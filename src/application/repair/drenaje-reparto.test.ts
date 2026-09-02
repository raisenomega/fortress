import { afterEach, describe, expect, it, vi } from 'vitest'
import type { ChainOutcome } from './motor-chain-outcome'
import { CTX, deps, motor } from './drenar-fixture'
import { drenarHastaOmega } from './drenar-hasta-omega'

afterEach(() => vi.restoreAllMocks())

const baja = (motivo: string): ChainOutcome => ({ kind: 'descartada', proposalId: 'x', motivo })

/**
 * El cajon que esto sustituye contaba quince motivos como "gate o correa", y
 * solo tres lo eran. Aqui se afirma el reparto por el bucle REAL, no por la
 * tabla: que el drenaje llame a la clasificacion y guarde donde toca.
 */
describe('el drenaje reparte cada baja por lo que le toca al operador', () => {
  it('los quince del cajon viejo se reparten por lo que le toca al operador', async () => {
    // El defecto entero, en una corrida: cinco motivos que el `else` contaba
    // juntos como "gate o correa" — y solo el primero lo era.
    motor(
      baja('gate_failed_at=lint'),
      baja('turnos_agotados'),
      baja('npm_ci_failed'),
      baja('invalid_state'),
      baja('superseded_by=a1b2c3d4')
    )

    expect(await drenarHastaOmega(CTX, 'p1', deps())).toMatchObject({
      trabajadas: 5,
      porCorrea: 1,
      porLimitePropio: 1,
      porEntornoDelProyecto: 1,
      porDefectoInterno: 1,
      superadas: 1
    })
  })

  it('un motivo que nadie declaro se cuenta aparte, no se diluye', async () => {
    motor(baja('motivo_que_no_existe'))
    const r = await drenarHastaOmega(CTX, 'p1', deps())
    expect(r).toMatchObject({ sinClasificar: 1, porCorrea: 0, porDefectoInterno: 0 })
  })
})
