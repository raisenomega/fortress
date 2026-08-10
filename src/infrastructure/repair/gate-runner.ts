import { GATE_COMMANDS, NPM_CI_TIMEOUT_MS, type GateCommand } from '@domain/repair/gate-config'
import type { CommandOutcome, GateOutcome } from '@domain/repair/gate-result'
import { spawnCommand } from './spawn-command'

export interface GateRunner {
  run(worktreePath: string): Promise<GateOutcome>
}

/**
 * El gate HERMETICO: npm ci limpio dentro del worktree (D12 — jamas el
 * node_modules del proyecto, jamas symlinks, aunque tarde: ese es el punto) y
 * despues los tres comandos en orden, cada uno bloqueante. El npm ci no es
 * juicio sino setup: no va como GATE_COMMAND, pero su outcome queda en la
 * autopsia. Sin cache de resultados: cada corrida es fresca (la leccion del
 * eslint --cache que mintio en I1).
 */
export function createGateRunner(
  bin = 'npm',
  commands: readonly GateCommand[] = GATE_COMMANDS,
  npmCiTimeoutMs = NPM_CI_TIMEOUT_MS
): GateRunner {
  return {
    run: async (worktreePath) => {
      const done: CommandOutcome[] = []

      const ci = await spawnCommand(bin, 'npm ci', ['ci'], worktreePath, npmCiTimeoutMs)
      done.push(ci)
      if (ci.exitCode !== 0 || ci.timedOut) {
        return { ok: false, commands: done, failedAt: 'npm ci', reason: ci.timedOut ? 'gate_timeout' : 'npm_ci_failed' } // prettier-ignore
      }

      for (const command of commands) {
        const outcome = await spawnCommand(bin, command.key, command.args, worktreePath, command.timeoutMs) // prettier-ignore
        done.push(outcome)
        if (outcome.exitCode !== 0 || outcome.timedOut) {
          return { ok: false, commands: done, failedAt: command.key, reason: outcome.timedOut ? 'gate_timeout' : 'gate_failed' } // prettier-ignore
        }
      }
      return { ok: true, commands: done }
    }
  }
}
