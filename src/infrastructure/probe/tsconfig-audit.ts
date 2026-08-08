import { existsSync } from 'fs'
import { join } from 'path'
import { runCommand } from './run-command'

/** Errores de la INFRA de project-references (no del codigo): tsc -b los emite si
 *  la config esta mal partida, pero no son errores de tipo reales. Se excluyen. */
const INFRA = /TS(6305|6306|6307|6310|6202|6377|6379)/

function realErrors(out: string): number {
  return (out.match(/error TS\d+/g) ?? []).filter((code) => !INFRA.test(code)).length
}

export interface TsAudit {
  readonly hasTs: boolean
  /** El gate del proyecto pasa (0) pero el chequeo REAL encuentra errores: verde falso. */
  readonly neutered: boolean
  readonly errors: number
}

/**
 * Chequeo REAL de tipos con `tsc -b` (build mode: SIGUE las references, a
 * diferencia de `tsc --noEmit` que las ignora — la trampa del verde falso). Si el
 * script del proyecto reporta 0 pero el real encuentra errores, el gate esta roto.
 */
export function auditTsc(projectPath: string, script: string | undefined): TsAudit {
  if (!existsSync(join(projectPath, 'tsconfig.json'))) {
    return { hasTs: script !== undefined, neutered: false, errors: 0 }
  }
  const real = realErrors(runCommand('npx', ['tsc', '-b', '--noEmit', '--force'], projectPath).out)
  if (script === undefined) return { hasTs: true, neutered: false, errors: real }
  const scriptErrors = realErrors(runCommand('npm', ['run', script], projectPath).out)
  return { hasTs: true, neutered: scriptErrors === 0 && real > 0, errors: real }
}
