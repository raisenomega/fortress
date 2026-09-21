import type { ChildProcess } from 'child_process'
import type { CommandOutcome } from '@domain/repair/gate-result'
import { senalAl } from '../claude-code/kill-signal'

/** Mata el GRUPO entero (npm run spawnea hijos: tsc, eslint, vitest). Matar
 *  solo al padre deja nietos vivos sosteniendo los pipes y `close` no llega.
 *  SIGTERM al grupo; a los 3s, SIGKILL — la leccion del boton Detener. Con
 *  bwrap delante, `--die-with-parent` remata lo de dentro cuando cae el padre. */
export function armTimeout(
  child: ChildProcess,
  timeoutMs: number,
  onFire: () => void
): NodeJS.Timeout {
  return setTimeout(() => {
    onFire()
    senalAl(child, 'SIGTERM', 'grupo')
    const escalation = setTimeout(() => senalAl(child, 'SIGKILL', 'grupo'), 3000)
    escalation.unref()
    child.once('close', () => clearTimeout(escalation))
  }, timeoutMs)
}

/** El comando que no llego a correr porque no habia caja: 127, como un binario
 *  que no existe, y el porque en stderr para la autopsia. */
export function sinCaja(command: string, startedAt: number, motivo: string): CommandOutcome {
  return { command, exitCode: 127, durationMs: Date.now() - startedAt, stdoutTail: '', stderrTail: motivo, timedOut: false } // prettier-ignore
}
