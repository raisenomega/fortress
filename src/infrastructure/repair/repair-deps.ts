import { app } from 'electron'
import { existsSync } from 'fs'
import { join } from 'path'
import type { AutoMergeDeps } from '@application/repair/auto-merge-types'
import type { GateDeps } from '@application/repair/run-gate'
import { readScopeGroups } from '../project/fortress-config'
import type { OmegaDeps } from '@application/repair/run-omega'
import type { GenerateDeps } from '@application/repair/generate-types'
import { CLAUDE_BIN } from '../claude-code/claude-cli'
import { readFortressConfig } from '../project/fortress-config'
import { createGitMergeApplier } from './git-merge-applier'
import { createGateRunner } from './gate-runner'
import { gateQueue } from './gate-queue'
import { createGraphGenerator } from './graph-generator'
import { createGraphOmega } from './graph-omega'
import { readAtHead, readAtSha, showHead } from './worktree-file-reader'
import { assertRepairSandbox } from './repair-sandbox'
import { createWorktreeManager } from './worktree-manager'

/** D7 — los worktrees del motor viven en userData, JAMAS dentro del repo. */
export function worktreeRoot(): string {
  return join(app.getPath('userData'), 'repair-worktrees')
}

/** Deps reales de generateFix: git, generador claude y sandbox del plan. */
export function buildGenerateDeps(projectId: string): GenerateDeps {
  const root = worktreeRoot()
  return {
    worktreeRoot: root,
    worktrees: createWorktreeManager(),
    generator: createGraphGenerator(CLAUDE_BIN, projectId),
    scopeGroups: readScopeGroups,
    sandbox: (worktreePath, proposalId, liveRepoPath) =>
      assertRepairSandbox(worktreePath, proposalId, root, liveRepoPath),
    now: Date.now
  }
}

/** Deps reales del gate hermetico (I3): npm ci + 3 comandos, cola de 1. */
export function buildGateDeps(projectId: string): GateDeps {
  const manager = createWorktreeManager()
  return {
    worktreeRoot: worktreeRoot(),
    worktreeExists: (path) => existsSync(path),
    isClean: (path) => manager.isClean(path),
    runner: createGateRunner(projectId),
    enqueue: (job) => gateQueue.enqueue(job),
    now: Date.now
  }
}

/** Deps reales de OMEGA (I4): lectura estricta, cola compartida con el gate. */
export function buildOmegaDeps(projectId: string): OmegaDeps {
  const manager = createWorktreeManager()
  return {
    worktreeRoot: worktreeRoot(),
    worktreeExists: (path) => existsSync(path),
    isClean: (path) => manager.isClean(path),
    changedFiles: async (worktreePath, baseSha) => (await manager.diff(worktreePath, baseSha)).files, // prettier-ignore
    diffText: (worktreePath) => showHead(worktreePath),
    readPost: (worktreePath, relPath) => readAtHead(worktreePath, relPath),
    readPre: (worktreePath, baseSha, relPath) => readAtSha(worktreePath, baseSha, relPath),
    omega: createGraphOmega(CLAUDE_BIN, projectId),
    enqueue: (job) => gateQueue.enqueue(job),
    now: Date.now
  }
}

/** Deps de la integracion automatica: git contra el repo vivo y el config del proyecto. */
export function buildAutoMergeDeps(): AutoMergeDeps {
  return { mergeApplier: createGitMergeApplier(), readConfig: readFortressConfig, now: Date.now }
}
