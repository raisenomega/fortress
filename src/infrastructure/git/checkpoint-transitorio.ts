import { git, gitRevert, gitSnapshot, isRepoRoot } from './git-snapshot'

/** Si el comando responde sin reventar: asi se contestan las dos preguntas. */
function gitResponde(cwd: string, args: readonly string[]): boolean {
  try {
    git(cwd, args)
    return true
  } catch {
    return false
  }
}

/** Sin commit al que volver no hay checkpoint que retirar. */
const tieneHistoria = (cwd: string): boolean => gitResponde(cwd, ['rev-parse', '--verify', 'HEAD'])
/** Git puede FIRMAR el checkpoint: sin identidad sale con 128, y `abrir` daba
 *  null mientras `redDisponible` decia que si — se editaba sin vuelta. */
const puedeCommitear = (cwd: string): boolean => gitResponde(cwd, ['var', 'GIT_COMMITTER_IDENT'])

/** Si aqui HAY red: la UNICA verdad de cuando `abrirCheckpoint` daria null, sin
 *  efectos, para que el modo degrade ANTES de abrir nada. */
export function redDisponible(cwd: string): boolean {
  return isRepoRoot(cwd) && tieneHistoria(cwd) && puedeCommitear(cwd)
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
