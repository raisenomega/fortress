import type { FindingMemory } from '@domain/project/finding-memory'
import type { Analyst } from '@domain/repair/analysis'
import type { Proposal } from '@domain/repair/proposal'
import type { ProposalPatch } from '@domain/repair/proposal-repository'
import type { AppContext } from '../context'

/** Un hallazgo ACTIVE y abierto, listo para ser candidato de C1. */
export function hallazgo(id: string, file: string): FindingMemory {
  return {
    id, identity: `LOW|${file}|t-${id}`, severity: 'LOW', title: `t-${id}`, file, line: 1,
    status: 'open', lifecycle: 'ACTIVE',
    firstSeen: '2026-08-08T10:00:00Z', lastSeen: '2026-08-08T10:00:00Z', resolvedAt: null
  } // prettier-ignore
}

export interface Bench {
  readonly context: AppContext
  readonly inserted: Proposal[]
  readonly patches: Array<ProposalPatch & { id: string }>
}

interface Opciones {
  readonly findings: readonly FindingMemory[]
  /** Lo que el analista fake respondera como `status` (REAL / OBSOLETO). */
  readonly verdictStatus?: string
  readonly obsoleteIds?: readonly string[]
  /** HEAD del repo; null simula un proyecto sin git. */
  readonly sha?: string | null
}

/** Contexto falso completo: registra inserciones y patches para asertar. */
export function bench(opts: Opciones): Bench {
  const inserted: Proposal[] = []
  const patches: Array<ProposalPatch & { id: string }> = []
  const analyst: Analyst = {
    study: (target) =>
      Promise.resolve({
        target, status: opts.verdictStatus ?? 'REAL', whatToChange: 'w', where: 'd',
        patternToCopy: 'p', doNotTouch: 'n', risk: 'riesgo bajo', tokensUsed: 1
      }) // prettier-ignore
  }
  const context = {
    projects: { findById: () => ({ id: 'p1', path: '/repo/p1' }) },
    scans: { listByProject: () => [{ id: 'scan-1' }] },
    findings: { listMemory: () => opts.findings },
    repairProposals: {
      insert: (p: Proposal): void => void inserted.push(p),
      update: (id: string, patch: ProposalPatch): void => void patches.push({ id, ...patch }),
      findObsoleteFindingIds: () => opts.obsoleteIds ?? [],
      findById: () => null,
      listByProject: () => []
    },
    analystFor: () => analyst,
    headSha: () => (opts.sha === undefined ? 'abc1234' : opts.sha)
  } as unknown as AppContext
  return { context, inserted, patches }
}
