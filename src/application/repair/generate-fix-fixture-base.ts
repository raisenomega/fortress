import type { Arreglo } from '@domain/repair/leer-arreglo'
import type { ScopeGroup } from '@domain/repair/scope-groups'
import type { Proposal } from '@domain/repair/proposal'
import { buildAgentRunEvent, buildTransitionEvent, type ProposalEvent } from '@domain/repair/proposal-event' // prettier-ignore
import type { ProposalPatch } from '@domain/repair/proposal-repository'
import type { NewAgentRun } from '@domain/telemetry/agent-run'
import type { AppContext } from '../context'
import type { GenerateDeps } from './generate-types'

export interface Opciones {
  readonly scopeGroups?: readonly ScopeGroup[]
  readonly state?: Proposal['state']
  readonly latestId?: string
  readonly spentPrevio?: number
  readonly generatorFails?: boolean
  /** El generador se quedo sin vueltas: desenlace propio, no averia. */
  readonly turnosAgotados?: boolean
  /** NUESTRO reloj se agoto. Llega SIN factura, como en el origen real: el
   *  SIGKILL cae antes de que el CLI emita su unico JSON con el gasto. */
  readonly timedOut?: boolean
  readonly genCost?: number
  readonly hasChanges?: boolean
  readonly changed?: readonly string[]
  readonly sandboxError?: string
  readonly conAnalisis?: boolean
  readonly sinPrimary?: boolean
  /** El ancla del hallazgo, para probar archivos sin extension. */
  readonly ancla?: string
  /** Donde el analisis dice que va el fix (ADR-102). Por defecto, el ancla. */
  readonly arreglo?: Arreglo
  /** Un analisis anterior al ADR-102, o un analista que no contesto. */
  readonly sinArreglo?: boolean
  /** La huella de `.fortress/config` del worktree. */
  readonly huella?: string
}

export interface Bench {
  readonly context: AppContext
  readonly deps: GenerateDeps
  readonly patches: Array<ProposalPatch & { id: string }>
  readonly events: ProposalEvent[]
  readonly calls: string[]
  readonly prompts: string[]
  /** Lo que se asento en el libro mayor: con factura o sin ella. */
  readonly runs: NewAgentRun[]
}

/** La factura que NO existe: el SIGKILL del plazo llega antes del JSON. */
export const SIN_FACTURA = { durationMs: 900_000, startedAt: 1, endedAt: 900_001 }

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
    const file = opts.sinPrimary === true ? '' : (opts.ancla ?? ANALYSIS.target.file)
    const arreglo = opts.sinArreglo === true ? {} : { arreglo: opts.arreglo ?? { file, line: 1 } }
    const analysis = { ...ANALYSIS, target: { ...ANALYSIS.target, file }, ...arreglo }
    chain.push(buildTransitionEvent({ proposalId: 'prop-1', seq: 2, phase: 'ANALYZE', toState: 'ANALIZADO', evidenceJson: JSON.stringify(analysis), ts: 2 })) // prettier-ignore
  }
  return chain
}
