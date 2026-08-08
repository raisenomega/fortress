import { spawnSync } from 'child_process'

export interface CmdResult {
  readonly code: number
  readonly out: string
  /** true si el comando no existe / no arranca (distinto de "corrio y fallo"). */
  readonly missing: boolean
}

/**
 * Corre un comando ACOTADO dentro del proyecto y junta stdout+stderr. Solo se usa
 * en proyectos de CONFIANZA: `npm run X` / `npx` ejecutan codigo del repo auditado.
 * Nunca via shell (array de args), con timeout y buffer tope.
 */
export function runCommand(cmd: string, args: readonly string[], cwd: string): CmdResult {
  const result = spawnSync(cmd, [...args], {
    cwd,
    encoding: 'utf8',
    timeout: 240_000,
    maxBuffer: 32_000_000,
    // CI=true: vitest/jest corren UNA vez y no entran en modo watch (colgarian).
    env: { ...process.env, CI: 'true' }
  })
  const out = `${result.stdout ?? ''}${result.stderr ?? ''}`
  return { code: result.status ?? 1, out, missing: result.error !== undefined }
}
