import type { Proposal } from '@domain/repair/proposal'
import { buildAgentRunEvent, buildTransitionEvent, type ProposalEvent } from '@domain/repair/proposal-event' // prettier-ignore
import type { ProposalPatch } from '@domain/repair/proposal-repository'
import type { AppContext } from '../context'
import type { GenerateDeps } from './generate-types'

export interface Opciones {
  readonly state?: Proposal['state']
  readonly latestId?: string
  readonly spentPrevio?: number
  readonly generatorFails?: boolean
  readonly genCost?: number
  readonly hasChanges?: boolean
  readonly changed?: readonly string[]
  readonly sandboxError?: string
  readonly conAnalisis?: boolean
}

export interface Bench {
  readonly context: AppContext
  readonly deps: GenerateDeps
  readonly patches: Array<ProposalPatch & { id: string }>
  readonly events: ProposalEvent[]
  readonly calls: string[]
}

export const ANALYSIS = {
  target: { id: 'f1', severity: 'LOW', title: 'parentDir sin validar', file: 'src/a/b.ts', line: 1 },
  status: 'REAL', whatToChange: 'validar', where: 'src/a/b.ts',
  patternToCopy: 'p', doNotTouch: 'n', risk: 'bajo', tokensUsed: 1
} // prettier-ignore

export function proposalDe(opts: Opciones): Proposal {
  return { id: 'prop-1', projectId: 'p1', findingId: 'f1', baseSha: 'base', state: opts.state ?? 'ANALIZADO', analysisVerdict: 'REAL', createdAt: 10, updatedAt: 10 } // prettier-ignore
}

export function cadenaDe(opts: Opciones): ProposalEvent[] {
  const chain: ProposalEvent[] = [
    buildAgentRunEvent({ proposalId: 'prop-1', seq: 1, phase: 'ANALYZE', actor: 'claude-analyst', costTokens: opts.spentPrevio ?? 1000, ts: 1 }) // prettier-ignore
  ]
  if (opts.conAnalisis !== false) {
    chain.push(buildTransitionEvent({ proposalId: 'prop-1', seq: 2, phase: 'ANALYZE', toState: 'ANALIZADO', evidenceJson: JSON.stringify(ANALYSIS), ts: 2 })) // prettier-ignore
  }
  return chain
}
