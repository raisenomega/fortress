import { spawn } from 'child_process'
import { redactSecrets } from '@domain/chat/tool-detail'
import { TAIL_CHARS } from '@domain/repair/gate-config'
import type { CommandOutcome } from '@domain/repair/gate-result'
import { tail } from '@domain/repair/tail'
import { trackChild } from '../claude-code/child-registry'
import { buildGateEnv } from './gate-env'
import type { Lanzamiento } from '../sandbox/en-caja'
import { armTimeout } from './spawn-command-vida'

export interface Corrida {
  readonly key: string
  readonly cwd: string
  readonly timeoutMs: number
  readonly owner: string | null
  readonly startedAt: number
}

/**
 * Corre lo que `enCaja` devolvio: spawn con args array (jamas shell strings),
 * grupo de proceso propio (detached) para poder matar el arbol completo, y
 * buffers rotativos — solo los ultimos TAIL_CHARS viajan a la autopsia.
 *
 * El entorno lo acota ESTE fichero, no quien lo llama: lista blanca sobre
 * `process.env` en el momento de lanzar, que es lo que el barrido
 * `spawn-entorno-acotado` exige ver en cada lanzador, sin fiarse de un parametro.
 */
export function correrEnCaja(l: Lanzamiento, c: Corrida): Promise<CommandOutcome> {
  const env = buildGateEnv(process.env)
  return new Promise((resolve) => {
    const child = spawn(l.bin, [...l.args], { cwd: c.cwd, detached: true, env })
    trackChild(child, c.owner, 'grupo')
    let out = ''
    let errOut = ''
    let timedOut = false
    const timer = armTimeout(child, c.timeoutMs, () => (timedOut = true))

    // La autopsia se PERSISTE entera en `evidence_json`, que es append-only, y
    // aqui imprime codigo ajeno: se redacta ANTES de recortar, porque `tail`
    // corta por el medio y un secreto partido ya no lo reconoce ninguna regex.
    const outcome = (exitCode: number, extraErr = ''): CommandOutcome => ({
      command: c.key,
      exitCode,
      durationMs: Date.now() - c.startedAt,
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
