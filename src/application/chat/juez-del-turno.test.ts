import { describe, expect, it } from 'vitest'
import { EMPTY_CORPUS } from '@domain/project/corpus-descriptor'
import type { CheckpointDelTurno } from '@domain/chat/red-de-reversion'
import { planDelTerminal } from '@domain/chat/plan-del-terminal'
import { conVeredicto, EJES, META } from '../repair/juicio-de-omega-fixture'
import { FOCO } from './ciclo-de-convergencia-fixture'
import { juezConOmega } from './juez-del-turno'
import type { OmegaDelTurno } from './omega-del-turno'

const PLAN = planDelTerminal(FOCO, 'arregla la CSP')
const CP = {
  conservar: () => true,
  revertir: () => true,
  diff: () => ({ diffText: 'd', tocados: ['a.ts'], previo: () => 'x', actual: () => 'y' })
} as CheckpointDelTurno

/** Anota lo que se facturo y lo que se asento: las dos lineas que CRUZAN del
 *  Motor al Terminal (ADR-090). Un juicio mudo seria un coste invisible. */
function contexto(): { ctx: never; runs: unknown[]; notas: unknown[] } {
  const runs: unknown[] = []
  const notas: unknown[] = []
  const ctx = {
    corpus: { of: () => EMPTY_CORPUS },
    runs: { record: (r: unknown) => (runs.push(r), 'run-1') },
    projects: { findById: () => ({ id: 'p1', path: '/p', name: 'P' }) },
    selfObservations: { add: (n: unknown) => notas.push(n) }
  }
  return { ctx: ctx as never, runs, notas }
}

const omegaQueDice = (r: Awaited<ReturnType<OmegaDelTurno['run']>>): OmegaDelTurno => ({
  run: () => Promise.resolve(r)
})

describe('el juez del turno: OMEGA antes de conservar', () => {
  it('APROBADO y factura en agent_runs con el projectId del TERMINAL', async () => {
    const { ctx, runs } = contexto()
    const juez = juezConOmega({ context: ctx, projectId: 'p1', cwd: '/p', agentes: 3, avisar: () => {}, omega: omegaQueDice(conVeredicto({ ...EJES, veredicto_global: 'APROBADO', razon: 'ok' })) }) // prettier-ignore

    const v = await juez(CP, PLAN)

    expect(v).toEqual({ juzgado: true, aprobado: true })
    expect(runs).toHaveLength(1)
    expect(runs[0]).toMatchObject({ projectId: 'p1', agentId: 'sentinel-omega', kind: 'repair' })
  })

  it('VETADO trae la razon y una huella de lo que se intento', async () => {
    const { ctx } = contexto()
    const veta = conVeredicto({ ...EJES, resuelve_el_hallazgo: 'NO', veredicto_global: 'VETADO', razon: 'no cubre inline' }) // prettier-ignore
    const juez = juezConOmega({ context: ctx, projectId: 'p1', cwd: '/p', agentes: 3, avisar: () => {}, omega: omegaQueDice(veta) }) // prettier-ignore

    const v = await juez(CP, PLAN)

    expect(v).toMatchObject({ juzgado: true, aprobado: false, razon: 'no cubre inline' })
    expect(v.juzgado && !v.aprobado && v.huella.length).toBeGreaterThan(0)
  })

  it('sin ficheros tocados NO se juzga, y no se gasta una corrida', async () => {
    const { ctx, runs } = contexto()
    const vacio = { ...CP, diff: () => ({ diffText: '', tocados: [], previo: () => '', actual: () => '' }) } // prettier-ignore
    const juez = juezConOmega({ context: ctx, projectId: 'p1', cwd: '/p', agentes: 3, avisar: () => {}, omega: omegaQueDice(conVeredicto({ ...EJES, veredicto_global: 'APROBADO', razon: 'ok' })) }) // prettier-ignore

    expect(await juez(vacio, PLAN)).toEqual({ juzgado: false })
    expect(runs).toHaveLength(0)
  })

  it('si OMEGA no arranca NO se inventa veredicto: decide el gate', async () => {
    const { ctx } = contexto()
    const roto = { ok: false as const, error: 'x', timedOut: false, runMeta: META }
    const juez = juezConOmega({ context: ctx, projectId: 'p1', cwd: '/p', agentes: 3, avisar: () => {}, omega: omegaQueDice(roto) }) // prettier-ignore

    expect(await juez(CP, PLAN)).toEqual({ juzgado: false })
  })
})
