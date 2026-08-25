import { spawn, type ChildProcess } from 'child_process'
import { redactSecrets } from '@domain/chat/tool-detail'
import { TAIL_CHARS } from '@domain/repair/gate-config'
import type { CommandOutcome } from '@domain/repair/gate-result'
import { tail } from '@domain/repair/tail'
import { buildGateEnv } from './gate-env'
import { trackChild } from '../claude-code/child-registry'
import { senalAl } from '../claude-code/kill-signal'

/** Mata el GRUPO entero (npm run spawnea hijos: tsc, eslint, vitest). Matar
 *  solo al padre deja nietos vivos sosteniendo los pipes y `close` no llega. */
/** SIGTERM al grupo; a los 3s, SIGKILL — la leccion del boton Detener. */
function armTimeout(child: ChildProcess, timeoutMs: number, onFire: () => void): NodeJS.Timeout {
  return setTimeout(() => {
    onFire()
    senalAl(child, 'SIGTERM', 'grupo')
    const escalation = setTimeout(() => senalAl(child, 'SIGKILL', 'grupo'), 3000)
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
  timeoutMs: number,
  owner: string | null = null
): Promise<CommandOutcome> {
  const startedAt = Date.now()
  return new Promise((resolve) => {
    // Lista blanca, no herencia: aqui corren los scripts del repo AUDITADO.
    // `CI` va dentro porque sin ella un proyecto que llama `vitest` a secas
    // vigila ficheros y cuelga el gate hasta el timeout. Se compone AQUI y no al
    // cargar el modulo: `augmentPath()` completa el PATH en el arranque mutando
    // `process.env`, y el gate tiene que correr con el de ahora.
    const env = buildGateEnv(process.env)
    const child = spawn(bin, args as string[], { cwd, detached: true, env })
    trackChild(child, owner, 'grupo')
    let out = ''
    let errOut = ''
    let timedOut = false
    const timer = armTimeout(child, timeoutMs, () => (timedOut = true))

    // La autopsia se PERSISTE entera en `evidence_json`, que es append-only, y
    // aqui imprime codigo ajeno: se redacta ANTES de recortar, porque `tail`
    // corta por el medio y un secreto partido ya no lo reconoce ninguna regex.
    const outcome = (exitCode: number, extraErr = ''): CommandOutcome => ({
      command: key,
      exitCode,
      durationMs: Date.now() - startedAt,
      stdoutTail: tail(redactSecrets(out), TAIL_CHARS),
      stderrTail: tail(redactSecrets(errOut + extraErr), TAIL_CHARS),
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
