import { spawn } from 'child_process'

export interface CmdResult {
  readonly code: number
  readonly out: string
  /** true si el comando no existe / no arranca (distinto de "corrio y fallo"). */
  readonly missing: boolean
}

const TIMEOUT_MS = 240_000
const MAX_OUT = 32_000_000

/**
 * Corre un comando ACOTADO dentro del proyecto (junta stdout+stderr) SIN bloquear
 * el event loop: `spawn` async, el hijo corre en su propio proceso del SO y el
 * `await` cede el control (la ventana de Electron no se congela durante el audit).
 * Solo en proyectos de CONFIANZA: `npm run X` / `npx` ejecutan codigo del repo.
 */
export function runCommand(cmd: string, args: readonly string[], cwd: string): Promise<CmdResult> {
  return new Promise((resolve) => {
    // CI=true: vitest/jest corren UNA vez y no entran en modo watch (colgarian).
    const child = spawn(cmd, [...args], { cwd, env: { ...process.env, CI: 'true' } })
    let out = ''
    const capture = (chunk: Buffer): void => {
      out += chunk.toString('utf8')
      if (out.length > MAX_OUT) out = out.slice(-MAX_OUT)
    }
    child.stdout?.on('data', capture)
    child.stderr?.on('data', capture)
    const timer = setTimeout(() => child.kill('SIGKILL'), TIMEOUT_MS)
    child.on('error', () => {
      clearTimeout(timer)
      resolve({ code: 1, out, missing: true })
    })
    child.on('close', (code) => {
      clearTimeout(timer)
      resolve({ code: code ?? 1, out, missing: false })
    })
  })
}
