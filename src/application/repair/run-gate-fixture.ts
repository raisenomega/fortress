import type { CommandOutcome, GateOutcome } from '@domain/repair/gate-result'
import type { Proposal } from '@domain/repair/proposal'
import type { ProposalEvent } from '@domain/repair/proposal-event'
import type { ProposalPatch } from '@domain/repair/proposal-repository'
import type { AppContext } from '../context'
import type { GateDeps } from './run-gate'

export const cmd = (command: string, exitCode = 0, timedOut = false): CommandOutcome => ({
  command, exitCode, durationMs: 1000, stdoutTail: 'out', stderrTail: 'err', timedOut
}) // prettier-ignore

export interface Opciones {
  readonly state?: Proposal['state']
  readonly outcome?: GateOutcome
  readonly worktreeExists?: boolean
  readonly clean?: boolean
  /** El proyecto es de confianza. Los reales lo son; el gate no corre sin ella. */
  readonly trusted?: boolean
}

export interface Bench {
  readonly context: AppContext
  readonly deps: GateDeps
  readonly patches: Array<ProposalPatch & { id: string }>
  readonly events: ProposalEvent[]
}

const VERDE: GateOutcome = {
  ok: true,
  commands: [cmd('npm ci'), cmd('typecheck'), cmd('lint'), cmd('test:unit')]
}

/** Contexto y deps falsos de runGate: registran patches y eslabones. */
export function bench(opts: Opciones = {}): Bench {
  const patches: Array<ProposalPatch & { id: string }> = []
  const events: ProposalEvent[] = []
  const proposal: Proposal = { id: 'prop-1', projectId: 'p1', findingId: 'f1', baseSha: 'base', state: opts.state ?? 'GENERADO', analysisVerdict: 'REAL', createdAt: 1, updatedAt: 1 } // prettier-ignore

  const context = {
    projects: { findById: () => ({ id: 'p1', path: '/repo/p1', trusted: opts.trusted ?? true }) },
    repairProposals: {
      findById: (id: string) => (id === 'prop-1' ? proposal : null),
      update: (id: string, patch: ProposalPatch): void => void patches.push({ id, ...patch })
    },
    eventLog: {
      list: () => Promise.resolve(events),
      record: (event: ProposalEvent): Promise<void> => {
        events.push(event)
        return Promise.resolve()
      }
    }
  } as unknown as AppContext

  const deps: GateDeps = {
    worktreeRoot: '/tmp/wt-root',
    worktreeExists: () => opts.worktreeExists ?? true,
    isClean: () => Promise.resolve(opts.clean ?? true),
    runner: { run: () => Promise.resolve(opts.outcome ?? VERDE) },
    // La caja se da por disponible: lo que estos bancos juzgan es el gate, no
    // la maquina. `gate-sin-caja.test.ts` es quien la quita.
    hayCaja: () => ({ ok: true, value: undefined }),
    enqueue: (job) => job(),
    now: () => 42
  }
  return { context, deps, patches, events }
}
