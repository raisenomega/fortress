import { app } from 'electron'
import { existsSync, readdirSync, rmSync } from 'fs'
import { join } from 'path'
import type { GateDeps } from '@application/repair/run-gate'
import type { GenerateDeps } from '@application/repair/generate-types'
import type { ReclaimDeps } from '@application/repair/reclaim-worktrees'
import { CLAUDE_BIN } from '../claude-code/claude-cli'
import { createGateRunner } from './gate-runner'
import { gateQueue } from './gate-queue'
import { createGraphGenerator } from './graph-generator'
import { assertRepairSandbox } from './repair-sandbox'
import { createWorktreeManager } from './worktree-manager'

/** D7 — los worktrees del motor viven en userData, JAMAS dentro del repo. */
export function worktreeRoot(): string {
  return join(app.getPath('userData'), 'repair-worktrees')
}

/** Deps reales de generateFix: git, generador claude y sandbox del plan. */
export function buildGenerateDeps(): GenerateDeps {
  const root = worktreeRoot()
  return {
    worktreeRoot: root,
    worktrees: createWorktreeManager(),
    generator: createGraphGenerator(CLAUDE_BIN),
    sandbox: (worktreePath, proposalId, liveRepoPath) =>
      assertRepairSandbox(worktreePath, proposalId, root, liveRepoPath),
    now: Date.now
  }
}

/** Deps reales del gate hermetico (I3): npm ci + 3 comandos, cola de 1. */
export function buildGateDeps(): GateDeps {
  const manager = createWorktreeManager()
  return {
    worktreeRoot: worktreeRoot(),
    worktreeExists: (path) => existsSync(path),
    isClean: (path) => manager.isClean(path),
    runner: createGateRunner(),
    enqueue: (job) => gateQueue.enqueue(job),
    now: Date.now
  }
}

/** Deps reales del reclaim de arranque. */
export function buildReclaimDeps(): ReclaimDeps {
  const root = worktreeRoot()
  const manager = createWorktreeManager()
  return {
    listWorktreeDirs: () => (existsSync(root) ? readdirSync(root) : []),
    pathOf: (proposalId) => join(root, proposalId),
    removeWorktree: (worktreePath, projectRepoPath) =>
      manager.remove(worktreePath, '', projectRepoPath),
    rmDir: (path) => rmSync(path, { recursive: true, force: true }),
    now: Date.now
  }
}
