import { GATE_COMMANDS, NPM_CI_TIMEOUT_MS, type GateCommand } from '@domain/repair/gate-config'
import type { CommandOutcome, GateOutcome } from '@domain/repair/gate-result'
import { resolveVerifyScript } from '@domain/settings/safe-commands'
import { correrComandos } from './gate-sequence'
import { readProjectScripts } from '../claude-code/project-scripts'
import { spawnCommand } from './spawn-command'

export interface GateRunner {
  run(worktreePath: string, baseSha: string): Promise<GateOutcome>
}

/** El comando con el nombre de script que ESTE repo usa, o null si no lo tiene. */
function real(command: GateCommand, scripts: readonly string[]): GateCommand | null {
  const script = resolveVerifyScript(command.key, scripts)
  return script === null ? null : { ...command, args: ['run', script] }
}

/**
 * El gate HERMETICO: npm ci limpio dentro del worktree (D12 — jamas el
 * node_modules del proyecto, jamas symlinks, aunque tarde: ese es el punto) y
 * despues los comandos en orden, cada uno bloqueante. El npm ci no es juicio
 * sino setup: no va como GATE_COMMAND, pero su outcome queda en la autopsia.
 * Sin cache de resultados: cada corrida es fresca (la leccion del eslint
 * --cache que mintio en I1).
 *
 * Los nombres de script se resuelven contra los que el proyecto tiene de
 * verdad: exigir `typecheck` a un repo que lo llama `type-check` rechazaba
 * fixes correctos por una convencion del auditor, no por un defecto del fix.
 * Lo que el proyecto no sabe verificar se salta y se dice; si no sabe verificar
 * NADA, no hay gate que dar por pasado y la cadena se corta ahi.
 */
export function createGateRunner(
  owner: string,
  bin = 'npm',
  commands: readonly GateCommand[] = GATE_COMMANDS,
  npmCiTimeoutMs = NPM_CI_TIMEOUT_MS
): GateRunner {
  return {
    run: async (worktreePath, baseSha) => {
      const done: CommandOutcome[] = []

      const ci = await spawnCommand(bin, 'npm ci', ['ci'], worktreePath, npmCiTimeoutMs, owner)
      done.push(ci)
      if (ci.exitCode !== 0 || ci.timedOut) {
        const reason = ci.timedOut
          ? 'gate_timeout'
          : ci.senal !== undefined
            ? 'gate_detenido'
            : 'npm_ci_failed'
        return { ok: false, commands: done, failedAt: 'npm ci', reason }
      }

      const scripts = readProjectScripts(worktreePath)
      const resueltos = commands.map((command) => ({
        key: command.key,
        cmd: real(command, scripts)
      }))
      const skipped = resueltos.filter((r) => r.cmd === null).map((r) => r.key)

      if (skipped.length === commands.length) {
        return { ok: false, commands: done, failedAt: 'scripts', reason: 'gate_sin_verificacion', skipped } // prettier-ignore
      }

      return correrComandos({ bin, worktreePath, baseSha, done, skipped, owner }, resueltos)
    }
  }
}
