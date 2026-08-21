import { spawn } from 'child_process'
import { buildGateEnv } from '../repair/gate-env'

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
 *
 * Y por eso el entorno va acotado con la MISMA lista blanca que el gate: este es
 * el otro sitio donde corre codigo del repo auditado, asi que heredaba los mismos
 * secretos de sesion —el agente ssh, el llavero, X11— por la misma via. Se reusa
 * `buildGateEnv` en vez de copiar la lista: dos listas blancas divergen, y la que
 * se quede atras es un agujero que nadie mira.
 */
export function runCommand(cmd: string, args: readonly string[], cwd: string): Promise<CmdResult> {
  return new Promise((resolve) => {
    // CI=true (dentro de la lista): vitest/jest corren UNA vez y no entran en
    // modo watch, que colgaria el probe hasta el timeout.
    const child = spawn(cmd, [...args], { cwd, env: buildGateEnv(process.env) })
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
