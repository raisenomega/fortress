import type { ScopeGroup } from '@domain/repair/scope-groups'
import type { AnalystRunMeta } from '@domain/repair/analysis'
import type { RejectionReason } from '@domain/repair/repair-rejection'

export interface WorktreeDiffInfo {
  readonly files: readonly string[]
  readonly insertions: number
  readonly deletions: number
}

/** Puerto de worktrees que la aplicacion necesita. Infra lo implementa con git. */
export interface WorktreePort {
  create(baseSha: string, projectRepoPath: string, worktreePath: string, branchName: string): Promise<{ ok: true } | { ok: false; error: string }> // prettier-ignore
  remove(worktreePath: string, branchName: string, projectRepoPath: string): Promise<void>
  hasChanges(worktreePath: string): Promise<boolean>
  changedFiles(worktreePath: string): Promise<string[]>
  diff(worktreePath: string, baseSha: string): Promise<WorktreeDiffInfo>
  commit(worktreePath: string, message: string): Promise<{ ok: true; sha: string } | { ok: false; error: string }> // prettier-ignore
}

/** Puerto del generador (C3). El motor jamas le cree los archivos tocados. */
export interface GeneratorPort {
  generate(worktreePath: string, prompt: string): Promise<
    | { ok: true; runMeta: AnalystRunMeta }
    /** Los dos hechos que SOLO el origen conoce: si se acabaron las vueltas y
     *  si se acabo el plazo. Sin ellos, el motivo tendria que adivinarse. */
    | { ok: false; error: string; turnosAgotados?: true; timedOut?: true; runMeta: AnalystRunMeta }
  > // prettier-ignore
}

export interface GenerateDeps {
  readonly worktreeRoot: string
  readonly worktrees: WorktreePort
  readonly generator: GeneratorPort
  /** assertRepairSandbox: el cwd de escritura es el worktree de ESA propuesta. */
  readonly sandbox: (worktreePath: string, proposalId: string, liveRepoPath: string) => { ok: true } | { ok: false; error: string } // prettier-ignore
  /** Los grupos que el proyecto declara, leidos del worktree (su ancla). */
  readonly scopeGroups: (worktreePath: string) => readonly ScopeGroup[]
  readonly now: () => number
}

export interface Produced {
  readonly worktreePath: string
  readonly allowed: string[]
  readonly allows: readonly string[]
  readonly cost: number
}

export type GenerateResult =
  | { ok: true; proposalId: string; commitSha: string; files: readonly string[] }
  | { ok: false; reason: RejectionReason | 'invalid_state'; detail?: string }
