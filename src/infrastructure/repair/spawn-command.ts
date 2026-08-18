import { spawn, type ChildProcess } from 'child_process'
import { TAIL_CHARS } from '@domain/repair/gate-config'
import type { CommandOutcome } from '@domain/repair/gate-result'
import { tail } from '@domain/repair/tail'

/** Mata el GRUPO entero (npm run spawnea hijos: tsc, eslint, vitest). Matar
 *  solo al padre deja nietos vivos sosteniendo los pipes y `close` no llega. */
function killGroup(child: ChildProcess, signal: NodeJS.Signals): void {
  try {
    if (child.pid !== undefined) process.kill(-child.pid, signal)
  } catch {
    // Grupo ya muerto: nada que hacer.
  }
}

/** SIGTERM al grupo; a los 3s, SIGKILL — la leccion del boton Detener. */
function armTimeout(child: ChildProcess, timeoutMs: number, onFire: () => void): NodeJS.Timeout {
  return setTimeout(() => {
    onFire()
    killGroup(child, 'SIGTERM')
    const escalation = setTimeout(() => killGroup(child, 'SIGKILL'), 3000)
    escalation.unref()
    child.once('close', () => clearTimeout(escalation))
  }, timeoutMs)
}

/**
 * Corre UN comando del gate: spawn con args array (jamas shell strings),
 * grupo de proceso propio (detached) para poder matar el arbol completo, y
 * buffers rotativos — solo los ultimos TAIL_CHARS viajan a la autopsia.
 */
export function spawnCommand(
  bin: string,
  key: string,
  args: readonly string[],
  cwd: string,
  timeoutMs: number
): Promise<CommandOutcome> {
  const startedAt = Date.now()
  return new Promise((resolve) => {
    // CI: los runners miran esa variable para correr UNA vez en lugar de
    // vigilar ficheros. Sin ella, un proyecto que llama `vitest` a secas cuelga
    // el gate hasta el timeout y el veredicto sale por reloj, no por juicio.
    // Pisar la del operador es deliberado: como se verifica lo decide el
    // auditor. Se compone AQUI y no al cargar el modulo: el entorno del proceso
    // puede cambiar despues, y el gate tiene que correr con el de ahora.
    const env = { ...process.env, CI: 'true' }
    const child = spawn(bin, args as string[], { cwd, detached: true, env })
    let out = ''
    let errOut = ''
    let timedOut = false
    const timer = armTimeout(child, timeoutMs, () => (timedOut = true))

    const outcome = (exitCode: number, extraErr = ''): CommandOutcome => ({
      command: key,
      exitCode,
      durationMs: Date.now() - startedAt,
      stdoutTail: tail(out, TAIL_CHARS),
      stderrTail: tail(errOut + extraErr, TAIL_CHARS),
      timedOut
    })

    child.stdout?.on('data', (d: Buffer) => (out = (out + d.toString()).slice(-TAIL_CHARS * 2)))
    child.stderr?.on('data', (d: Buffer) => (errOut = (errOut + d.toString()).slice(-TAIL_CHARS * 2))) // prettier-ignore
    child.on('close', (code) => {
      clearTimeout(timer)
      resolve(outcome(code ?? 1))
    })
    child.on('error', (error) => {
      clearTimeout(timer)
      resolve(outcome(127, error.message))
    })
  })
}
