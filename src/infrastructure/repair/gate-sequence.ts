import type { GateCommand } from '@domain/repair/gate-config'
import type { CommandOutcome, GateOutcome } from '@domain/repair/gate-result'
import { medirHerencia } from './gate-baseline'
import { spawnCommand } from './spawn-command'

export interface Resuelto {
  readonly key: string
  /** null si el proyecto no sabe cumplir esa intencion: no hay que correr nada. */
  readonly cmd: GateCommand | null
}

export interface Secuencia {
  readonly bin: string
  readonly worktreePath: string
  readonly baseSha: string
  /** Lo ya corrido (el npm ci del setup). Se sigue llenando aqui. */
  readonly done: CommandOutcome[]
  readonly skipped: readonly string[]
}

/**
 * Si el rojo de este comando ya estaba en la base. Un timeout nunca se hereda:
 * no hay salida que comparar, y colgarse no es un defecto que se arrastre. Sin
 * base medible tampoco se hereda — medirHerencia lo dice y la duda cuenta
 * contra el fix, nunca a su favor.
 */
async function esHeredado(
  s: Secuencia,
  key: string,
  cmd: GateCommand,
  salido: CommandOutcome
): Promise<boolean> {
  if (salido.timedOut) return false
  const salida = salido.stdoutTail + salido.stderrTail
  const medida = await medirHerencia(s.bin, s.worktreePath, s.baseSha, { ...cmd, key }, salida)
  return medida.heredado
}

/**
 * Los comandos del gate, en orden. Un rojo HEREDADO ya no corta la cadena: se
 * anota y se sigue. Pararse en el dejaba sin correr todo lo que venia detras
 * —los tests, entre otros— y despues no habia con que decidir nada: el ejercicio
 * del 18-ago cerro catorce propuestas sin ejecutar una sola vez `test:unit`.
 * Un rojo PROPIO sigue cortando en el acto: eso lo rompio el fix.
 *
 * El veredicto NO se mueve. Si algo fallo, el gate rechaza igual, y `failedAt`
 * sigue siendo el primer rojo que se encontro. Lo que cambia es cuanto se sabe
 * al rechazar, que es lo que hara falta para decidir despues.
 */
export async function correrComandos(
  s: Secuencia,
  resueltos: readonly Resuelto[]
): Promise<GateOutcome> {
  const heredado: string[] = []
  let primerFallo: string | null = null

  for (const { key, cmd } of resueltos) {
    if (cmd === null) continue
    const salido = await spawnCommand(s.bin, key, cmd.args, s.worktreePath, cmd.timeoutMs)
    s.done.push(salido)
    if (salido.exitCode === 0 && !salido.timedOut) continue

    primerFallo ??= key
    if (!(await esHeredado(s, key, cmd, salido))) {
      const reason = salido.timedOut ? 'gate_timeout' : 'gate_failed'
      return { ok: false, commands: s.done, failedAt: key, reason, skipped: s.skipped, heredado } // prettier-ignore
    }
    heredado.push(key)
  }

  if (primerFallo !== null) {
    return { ok: false, commands: s.done, failedAt: primerFallo, reason: 'gate_failed', skipped: s.skipped, heredado } // prettier-ignore
  }
  return { ok: true, commands: s.done, skipped: s.skipped }
}
