import type { ProposalEvent } from '@domain/repair/proposal-event'
import type { ProposalPatch } from '@domain/repair/proposal-repository'
import type { AppContext } from '../context'
import type { GenerateDeps } from './generate-types'
import { cadenaDe, proposalDe, type Bench, type Opciones } from './generate-fix-fixture-base'

export type { Bench, Opciones } from './generate-fix-fixture-base'

function depsDe(opts: Opciones, calls: string[], prompts: string[]): GenerateDeps {
  return {
    worktreeRoot: '/tmp/wt-root',
    worktrees: {
      create: () => (calls.push('create'), Promise.resolve({ ok: true as const })),
      remove: () => (calls.push('remove'), Promise.resolve()),
      hasChanges: () => Promise.resolve(opts.hasChanges ?? true),
      changedFiles: () => Promise.resolve([...(opts.changed ?? ['src/a/b.ts'])]),
      diff: () => Promise.resolve({ files: [...(opts.changed ?? ['src/a/b.ts'])], insertions: 3, deletions: 1 }), // prettier-ignore
      commit: () => (calls.push('commit'), Promise.resolve({ ok: true as const, sha: 'c'.repeat(40) })) // prettier-ignore
    },
    generator: {
      generate: (_wt: string, prompt: string) => {
        calls.push('generate')
        prompts.push(prompt)
        const runMeta = { tokensUsed: opts.genCost ?? 50_000, durationMs: 9, startedAt: 1, endedAt: 10 } // prettier-ignore
        return Promise.resolve(
          opts.generatorFails === true ? { ok: false as const, error: 'kaput', runMeta } : { ok: true as const, runMeta } // prettier-ignore
        )
      }
    },
    sandbox: () =>
      opts.sandboxError === undefined ? { ok: true } : { ok: false, error: opts.sandboxError },
    now: () => 99
  }
}

/** Contexto y deps falsos de generateFix: registran patches, eventos y llamadas. */
export function bench(opts: Opciones = {}): Bench {
  const patches: Array<ProposalPatch & { id: string }> = []
  const events: ProposalEvent[] = []
  const calls: string[] = []
  const prompts: string[] = []
  const proposal = proposalDe(opts)
  const chain = cadenaDe(opts)

  const context = {
    projects: { findById: () => ({ id: 'p1', path: '/repo/vivo' }) },
    repairProposals: {
      findById: (id: string) => (id === 'prop-1' ? proposal : null),
      update: (id: string, patch: ProposalPatch): void => void patches.push({ id, ...patch }),
      findLatestAnalyzedRealByFinding: () =>
        opts.latestId === undefined ? proposal : { ...proposal, id: opts.latestId }
    },
    eventLog: {
      list: () => Promise.resolve([...chain, ...events]),
      record: (event: ProposalEvent): Promise<void> => {
        events.push(event)
        return Promise.resolve()
      }
    }
  } as unknown as AppContext

  const deps = depsDe(opts, calls, prompts)
  return { context, deps, patches, events, calls, prompts }
}
