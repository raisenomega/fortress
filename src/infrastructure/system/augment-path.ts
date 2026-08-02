import { existsSync } from 'fs'
import { delimiter } from 'path'
import { userBinDirs } from './user-bin-dirs'

/**
 * Completa el PATH del proceso con las carpetas de binarios del usuario que
 * falten. Una app lanzada desde el escritorio no pasa por ~/.bashrc, asi que
 * no ve nvm ni ~/.local/bin y no encuentra herramientas que si estan.
 *
 * Se anaden al final, no al principio: si el sistema ya trae una version de
 * algo, sigue mandando ella. Aqui solo interesa encontrar lo que no aparecia.
 */
export function augmentPath(): void {
  const current = (process.env.PATH ?? '').split(delimiter).filter(Boolean)

  const missing = userBinDirs().filter((dir) => !current.includes(dir) && existsSync(dir))
  if (missing.length === 0) return

  process.env.PATH = [...current, ...missing].join(delimiter)
}
