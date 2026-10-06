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
  /** De quien son estos comandos: sin dueno, Detener no los alcanza. */
  readonly owner: string
  /** Lo ya corrido (el npm ci del setup). Se sigue llenando aqui. */
  readonly done: CommandOutcome[]
  readonly skipped: readonly string[]
}

/** Si el rojo de este comando ya estaba en la base. Un timeout nunca se hereda
 *  —no hay salida que comparar—, ni un fix sin base medible: la duda cuenta
 *  contra el, nunca a su favor. */
// prettier-ignore
async function esHeredado(s: Secuencia, key: string, cmd: GateCommand, salido: CommandOutcome): Promise<boolean> {
  if (salido.timedOut) return false
  const salida = salido.stdoutTail + salido.stderrTail
  // prettier-ignore
  const medida = await medirHerencia(s.owner, s.bin, s.worktreePath, s.baseSha, { ...cmd, key }, salida)
  return medida.heredado
}

/**
 * Los comandos del gate, en orden. Un rojo HEREDADO no corta la cadena: se
 * anota y se sigue, porque pararse en el dejaba sin correr lo que venia detras
 * —los tests, entre otros—. Un rojo PROPIO corta en el acto: eso lo rompio el
 * fix, y no hay mas que mirar.
 *
 * Y si al final TODO lo que fallo era heredado, el gate pasa: exigirle a un fix
 * que deje verde un arbol que ya estaba rojo antes de tocarlo es pedirle que
 * arregle el proyecto entero para poder arreglar una linea.
 */
export async function correrComandos(
  s: Secuencia,
  resueltos: readonly Resuelto[]
): Promise<GateOutcome> {
  const heredado: string[] = []
  let fallos = 0

  for (const { key, cmd } of resueltos) {
    if (cmd === null) continue
    const salido = await spawnCommand(s.bin, key, cmd.args, s.worktreePath, cmd.timeoutMs, s.owner) // prettier-ignore
    s.done.push(salido)
    if (salido.exitCode === 0 && !salido.timedOut) continue

    fallos += 1
    // Matado por una senal que no es el reloj: no se juzgo, y no se mide su herencia.
    if (salido.senal !== undefined && !salido.timedOut) return { ok: false, commands: s.done, failedAt: key, reason: 'gate_detenido', skipped: s.skipped, heredado } // prettier-ignore
    if (!(await esHeredado(s, key, cmd, salido))) {
      const reason = salido.timedOut ? 'gate_timeout' : 'gate_failed'
      return { ok: false, commands: s.done, failedAt: key, reason, skipped: s.skipped, heredado } // prettier-ignore
    }
    heredado.push(key)
  }

  // La cuenta se comprueba en vez de darse por hecha: hoy un rojo propio sale
  // por el return de arriba y no puede llegar aqui, pero de esa invariante
  // depende que no se acepte un fix que rompe el arbol, y eso se verifica.
  if (fallos > 0 && fallos !== heredado.length) {
    return { ok: false, commands: s.done, failedAt: heredado[0] ?? 'desconocido', reason: 'gate_failed', skipped: s.skipped, heredado } // prettier-ignore
  }
  return { ok: true, commands: s.done, skipped: s.skipped, ...(heredado.length ? { heredado } : {}) } // prettier-ignore
}
