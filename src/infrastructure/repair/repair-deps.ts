import { app } from 'electron'
import { existsSync } from 'fs'
import { join } from 'path'
import type { GateDeps } from '@application/repair/run-gate'
import type { OmegaDeps } from '@application/repair/run-omega'
import type { GenerateDeps } from '@application/repair/generate-types'
import { CLAUDE_BIN } from '../claude-code/claude-cli'
import { sondaDeBwrap } from '../sandbox/sonda-de-bwrap'
import { huellaDeConfig, readScopeGroups } from '../project/fortress-config'
import { createGateRunner } from './gate-runner'
import { gateQueue } from './gate-queue'
import { createGraphGenerator } from './graph-generator'
import { createGraphOmega } from './graph-omega'
import { grafoDelTurnoDe, type GrafoDelTurnoPort } from '../graph/grafo-del-turno'
import { getAppContext } from '../persistence/app-context'
import { readAtHead, readAtSha, showHead } from './worktree-file-reader'
import { assertRepairSandbox } from './repair-sandbox'
import { createWorktreeManager } from './worktree-manager'

/** El grafo del turno va atado a la RUTA del proyecto: el .db se busca por su slug. */
const grafoDelProyecto = (projectId: string): GrafoDelTurnoPort => grafoDelTurnoDe(getAppContext().projects.findById(projectId)?.path ?? null) // prettier-ignore

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
    generator: createGraphGenerator(CLAUDE_BIN, projectId, undefined, grafoDelProyecto(projectId)),
    scopeGroups: readScopeGroups,
    huellaDeConfig,
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
    hayCaja: () => sondaDeBwrap(),
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
    omega: createGraphOmega(CLAUDE_BIN, projectId, undefined, grafoDelProyecto(projectId)),
    enqueue: (job) => gateQueue.enqueue(job),
    now: Date.now
  }
}
