import { rmSync } from 'fs'
import { crearRepo } from './merge-repo-fixture'

/**
 * El PATH que hereda una app abierta con DOBLE CLIC: sin nvm, y por tanto sin
 * `node`. `augmentPath()` lo completa al arrancar —mutando `process.env`—, pero
 * eso pasa DESPUES de que los modulos se carguen. Vacio a proposito, para que la
 * prueba no dependa de lo que esta maquina tenga en `/usr/bin`.
 */
export const AL_CARGAR_SIN_CAJA = ''

/** Un repo de un solo uso. Se crea con el PATH completo porque el fixture lanza
 *  el `git` del sistema: sin PATH no habria ni repo que medir. */
export function repoDeUnUso(): { readonly dir: string; readonly borrar: () => void } {
  const dir = crearRepo(false)
  return { dir, borrar: (): void => rmSync(dir, { recursive: true, force: true }) }
}

/** Corre `f` con un PATH dado y devuelve el de verdad pase lo que pase. */
export async function conPath<T>(path: string, f: () => Promise<T>): Promise<T> {
  const real = process.env.PATH
  process.env.PATH = path
  try {
    return await f()
  } finally {
    process.env.PATH = real
  }
}
