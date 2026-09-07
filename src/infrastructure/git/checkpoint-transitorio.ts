import { execFileSync } from 'child_process'
import { gitRevert, gitSnapshot, isRepoRoot } from './git-snapshot'

/** git contra el repo real, salida en texto; lanza si git falla. */
function git(cwd: string, args: readonly string[]): string {
  return execFileSync('git', [...args], { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }) // prettier-ignore
}

/** Sin un commit al que devolver el puntero no hay checkpoint que retirar. */
function tieneHistoria(cwd: string): boolean {
  try {
    git(cwd, ['rev-parse', '--verify', 'HEAD'])
    return true
  } catch {
    return false
  }
}

/** Si aqui HAY red: la UNICA verdad de cuando `abrirCheckpoint` devolveria null,
 *  sin efectos, para que el modo efectivo degrade ANTES de abrir nada. */
export function redDisponible(cwd: string): boolean {
  return isRepoRoot(cwd) && tieneHistoria(cwd)
}

/**
 * Un checkpoint abierto sobre el arbol vivo, con sus dos unicas salidas. Las
 * dos devuelven si el commit del checkpoint quedo RETIRADO del historial:
 * `false` es un checkpoint huerfano en la rama del operador, y eso se dice.
 */
export interface CheckpointAbierto {
  readonly sha: string
  /** Exito: el commit sale del historial y el arbol se queda con las ediciones. */
  conservar(): boolean
  /** Fallo: las ediciones se descartan —ficheros nuevos incluidos— y el commit sale. */
  revertir(): boolean
}

/**
 * La red de reversion del ADR-079: el snapshot de siempre, pero TRANSITORIO.
 * `gitSnapshot` comitea el arbol (`add -A`, `--allow-empty`): la unica forma de
 * restaurarlo byte a byte, untracked incluidos. El commit no puede quedarse —uno
 * por mensaje, con el WIP del operador dentro—, asi que al cerrar, por la puerta
 * que sea, `reset --soft <sha^>`: el puntero vuelve y el arbol no se toca. El
 * indice queda como en el SNAPSHOT: el WIP pasa a stageado (contenido identico)
 * y lo que el agente edito queda SIN stagear — `git diff` es lo que hizo. Al
 * revertir, `clean -fd` es seguro: tras el `add -A` lo unico untracked es suyo.
 */
export function abrirCheckpoint(cwd: string): CheckpointAbierto | null {
  if (!redDisponible(cwd)) return null
  const sha = gitSnapshot(cwd, 'checkpoint transitorio')
  if (sha === null) return null

  const retirar = (): boolean => {
    try {
      git(cwd, ['reset', '--soft', `${sha}^`])
      return true
    } catch {
      return false
    }
  }

  return {
    sha,
    conservar: retirar,
    revertir: () => {
      gitRevert(cwd, sha)
      try {
        git(cwd, ['clean', '-fd'])
      } catch {
        // Mejor esfuerzo, como el reset --hard: lo que importa es retirar el commit.
      }
      return retirar()
    }
  }
}
