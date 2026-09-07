import { execFileSync } from 'child_process'
import { gitRevert, gitSnapshot } from './git-snapshot'

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
 * `gitSnapshot` comitea el arbol (`add -A`, `--allow-empty`): es la unica forma
 * de restaurarlo byte a byte, untracked incluidos. Lo que no puede quedarse es
 * el commit —en el Terminal seria uno por mensaje, con el trabajo a medias del
 * operador dentro—, asi que al cerrar, por la puerta que sea, `reset --soft
 * <sha^>`: el puntero vuelve y el arbol no se toca. El indice queda como en el
 * SNAPSHOT: lo del operador a medio stagear pasa a stageado (contenido
 * identico) y lo que el agente edito despues queda SIN stagear — `git diff` es
 * exactamente lo que hizo el agente. Al revertir, `clean -fd` es seguro porque
 * tras el `add -A` lo unico sin seguimiento es lo que el agente creo.
 *
 * null = sin red posible (no es raiz de un repo git, o no tiene commits): la
 * senal para que quien edita degrade.
 */
export function abrirCheckpoint(cwd: string): CheckpointAbierto | null {
  if (!tieneHistoria(cwd)) return null
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
