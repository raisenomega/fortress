/** D11 — los TRES comandos del gate humano, en orden fijo, cada uno bloqueante. */
export interface GateCommand {
  readonly key: string
  readonly args: readonly string[]
  readonly timeoutMs: number
}

export const GATE_COMMANDS: readonly GateCommand[] = [
  { key: 'typecheck', args: ['run', 'typecheck'], timeoutMs: 600_000 },
  { key: 'lint', args: ['run', 'lint'], timeoutMs: 600_000 },
  { key: 'test:unit', args: ['run', 'test:unit'], timeoutMs: 600_000 }
]

/** D12/D13 — npm ci hermetico dentro del worktree; su timeout propio. */
export const NPM_CI_TIMEOUT_MS = 900_000

/** D14 — cuanto stdout/stderr se conserva por comando para autopsia. */
export const TAIL_CHARS = 2000
