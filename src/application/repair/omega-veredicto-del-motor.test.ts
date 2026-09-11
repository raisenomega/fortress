import { describe, expect, it } from 'vitest'
import { APROBADO, bench } from './run-omega-fixture'
import { runOmega } from './run-omega'

const META = { tokensUsed: 120_000, durationMs: 1, startedAt: 1, endedAt: 2 }

/** Lo que el agente escribio: un VETO que las cuatro reglas duras NO sostienen.
 *  PARCIAL degrada la calidad y la juzga el humano; no veta (D19). */
const VETO_QUE_NO_VETA = {
  ...APROBADO,
  resuelve_el_hallazgo: 'PARCIAL' as const,
  veredicto_global: 'VETADO' as const
}

/**
 * El simetrico del caso que ya estaba probado.
 *
 * `run-omega.test.ts` cubria que el motor manda cuando el agente aprueba de mas:
 * ahi "mandar" es cerrar en RECHAZADO, y lo que se persista da igual porque el
 * estado es terminal. En la direccion contraria —el agente veta de mas— mandar
 * significa ABRIR la puerta a la firma, y entonces el veredicto persistido es lo
 * unico que decide si esa puerta se puede cruzar.
 *
 * Guardar la palabra del agente dejaba la propuesta en OMEGA —que dice
 * aprobada— llevando dentro un VETADO. `firmarIntegracion` lo leia y rebotaba
 * con `omega-no-aprobo`, siempre, y la integracion automatica tambien. La
 * propuesta se quedaba en la cola con aspecto de firmable, para siempre.
 */
describe('el veredicto que se persiste es el del motor, no el del agente', () => {
  it('agente VETADO por PARCIAL, reglas APROBADO: la transicion guarda APROBADO', async () => {
    const b = bench({ result: { ok: true, verdict: VETO_QUE_NO_VETA, runMeta: META, notas: [] } })

    const r = await runOmega(b.context, 'prop-1', b.deps)

    expect(r).toMatchObject({ ok: true })
    const cierre = b.events.at(-1)
    expect(cierre).toMatchObject({ fromState: 'GATE', toState: 'OMEGA' })
    // Es EXACTAMENTE el campo que lee `collectPostOmegaState` —el ultimo
    // OMEGA/TRANSITION— y con el decide `firmarIntegracion` si deja pasar el fix.
    expect(JSON.parse(cierre?.evidenceJson ?? '{}').verdict.veredicto_global).toBe('APROBADO')
  })

  it('los EJES se conservan enteros: solo cambia la conclusion', async () => {
    const b = bench({ result: { ok: true, verdict: VETO_QUE_NO_VETA, runMeta: META, notas: [] } })
    await runOmega(b.context, 'prop-1', b.deps)

    // El PARCIAL es la evidencia que el humano mira antes de firmar; sustituirlo
    // seria borrar lo que el agente vio, y eso no lo autoriza D19.
    const v = JSON.parse(b.events.at(-1)?.evidenceJson ?? '{}').verdict
    expect(v.resuelve_el_hallazgo).toBe('PARCIAL')
    expect(v.razon).toBe(APROBADO.razon)
  })

  it('el desacuerdo NO se borra: queda asentado en el libro', async () => {
    const b = bench({ result: { ok: true, verdict: VETO_QUE_NO_VETA, runMeta: META, notas: [] } })
    await runOmega(b.context, 'prop-1', b.deps)

    const mismatch = b.events.find((e) => e.reason === 'omega_verdict_mismatch')
    expect(mismatch?.eventType).toBe('DECISION')
    expect(JSON.parse(mismatch?.evidenceJson ?? '{}')).toEqual({ agentSaid: 'VETADO', rulesSay: 'APROBADO' }) // prettier-ignore
  })
})
