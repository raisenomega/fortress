import type { FindingMemory } from '@domain/project/finding-memory'
import type { SelfObservation } from '@domain/system/self-observation'
import type { Proposal } from '@domain/repair/proposal'
import { bench, hallazgo, type Bench } from './plan-repair-fixture'

/** Propuesta RECHAZADA por razonamiento: la candidata tipica a reintento. */
export function vieja(over: Partial<Proposal> = {}): Proposal {
  return {
    id: 'vieja123-0000-4000-8000-000000000000', projectId: 'p1', findingId: 'f1',
    baseSha: 'old4321', state: 'RECHAZADO', analysisVerdict: 'REAL',
    analysisReason: 'omega_vetado: el fix no cubre la fuga', createdAt: 100, updatedAt: 200,
    ...over
  } // prettier-ignore
}

interface Opciones {
  /** La propuesta que findById devolvera; null simula id desconocido. */
  readonly old?: Proposal | null
  /** Propuestas preexistentes del proyecto (para already_superseded_by). */
  readonly otras?: readonly Proposal[]
  readonly findings?: readonly FindingMemory[]
  readonly verdictStatus?: string
  readonly sha?: string | null
  readonly cerradas?: readonly SelfObservation[]
}

/**
 * Bench de plan-repair con el repo ampliado: SI encuentra a la vieja y
 * listByProject incluye lo insertado — el doble retry choca de verdad.
 */
export function retryBench(opts: Opciones = {}): Bench {
  const old = opts.old === undefined ? vieja() : opts.old
  const b = bench({
    findings: opts.findings ?? [hallazgo('f1', 'a.ts')],
    verdictStatus: opts.verdictStatus,
    cerradas: opts.cerradas,
    sha: opts.sha
  })
  Object.assign(b.context.repairProposals, {
    findById: (id: string) => (old !== null && id === old.id ? old : null),
    listByProject: () => [...(opts.otras ?? []), ...b.inserted]
  })
  return b
}
