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
  /** sha1 del trabajo SIN comitear —ediciones Y creados—, o null si git no se
   *  dejo leer. Se pide ANTES del commit: despues el diff esta vacio. */
  huella(worktreePath: string): Promise<string | null>
  commit(worktreePath: string, message: string): Promise<{ ok: true; sha: string } | { ok: false; error: string }> // prettier-ignore
}

/** Puerto del generador (C3). El motor jamas le cree los archivos tocados.
 *  `reanudar` es la sesion de la vuelta anterior del lazo (ADR-110); sin ella,
 *  sesion nueva, que es como corre la primera vuelta. */
export interface GeneratorPort {
  generate(worktreePath: string, prompt: string, reanudar?: string): Promise<
    | { ok: true; runMeta: AnalystRunMeta; sesion?: string }
    /** Los dos hechos que SOLO el origen conoce: si se acabaron las vueltas y
     *  si se acabo el plazo. Sin ellos, el motivo tendria que adivinarse. */
    | { ok: false; error: string; turnosAgotados?: true; timedOut?: true; runMeta: AnalystRunMeta; sesion?: string }
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
  /** La huella de `.fortress/config` en ese arbol (ADR-102 §4). */
  readonly huellaDeConfig: (worktreePath: string) => string
  readonly now: () => number
}

export interface Produced {
  readonly worktreePath: string
  readonly allowed: string[]
  readonly allows: readonly string[]
  readonly cost: number
}

export type GenerateResult =
  | { ok: true; proposalId: string; commitSha: string; files: readonly string[]; sesion?: string }
  | { ok: false; reason: RejectionReason | 'invalid_state'; detail?: string; sesion?: string }
