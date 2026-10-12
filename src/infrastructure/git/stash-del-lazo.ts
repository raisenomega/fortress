import { git } from './git-snapshot'

/** La marca de NUESTRO stash: `pop` solo toca el nuestro, nunca el del usuario. */
const MARCA = 'fortress-lazo-wip'

/** Como quedo el intento de restaurar el WIP. */
export type DesenlacePop = 'restaurado' | 'vacio' | 'conflicto'

/**
 * Al ARRANCAR el lazo: guarda el WIP del cliente (reversible) para que el arbol
 * quede LIMPIO y el commit durable tome solo lo del agente. `-u` incluye los
 * untracked. Devuelve si quedo algo guardado (nada que guardar = false).
 */
export function stashDelLazo(cwd: string): boolean {
  try {
    const antes = git(cwd, ['stash', 'list']).trim()
    git(cwd, ['stash', 'push', '-u', '-m', MARCA])
    return git(cwd, ['stash', 'list']).trim() !== antes
  } catch {
    return false
  }
}

/**
 * Al PARAR: restaura el WIP. Solo si el stash de arriba es el NUESTRO (por la
 * marca). Si el `pop` CONFLICTA, NO se fuerza: git deja el stash intacto y se
 * reporta — el trabajo del usuario no se pierde.
 */
export function popDelLazo(cwd: string): DesenlacePop {
  try {
    if (!git(cwd, ['stash', 'list', '-1']).includes(MARCA)) return 'vacio'
    git(cwd, ['stash', 'pop'])
    return 'restaurado'
  } catch {
    return 'conflicto'
  }
}
