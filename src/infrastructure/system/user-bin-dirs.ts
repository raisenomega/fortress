import { readdirSync } from 'fs'
import { homedir, platform } from 'os'
import { join } from 'path'

/** Cada gestor de versiones de Node planta sus binarios en su propia carpeta. */
function nodeVersionManagerDirs(home: string): string[] {
  const roots = [
    join(home, '.nvm', 'versions', 'node'),
    join(home, '.fnm', 'node-versions'),
    join(home, '.local', 'share', 'fnm', 'node-versions')
  ]

  return roots.flatMap((root) => {
    try {
      // fnm anida un nivel mas (<version>/installation/bin); se anaden los dos.
      return readdirSync(root).flatMap((version) => [
        join(root, version, 'bin'),
        join(root, version, 'installation', 'bin')
      ])
    } catch {
      return []
    }
  })
}

/**
 * Sitios habituales de las herramientas de usuario (claude, git, gh...).
 *
 * Hace falta porque una app lanzada con doble clic no ejecuta ~/.bashrc, asi
 * que hereda un PATH minimo del sistema: ve /usr/bin pero no nvm ni ~/.local/bin.
 * Sin esto, FORTRESS daba por no instalado un Claude Code que si estaba.
 */
export function userBinDirs(): string[] {
  const home = homedir()

  const common = [
    join(home, '.local', 'bin'),
    join(home, 'bin'),
    join(home, '.bun', 'bin'),
    join(home, '.volta', 'bin'),
    join(home, '.npm-global', 'bin'),
    join(home, '.yarn', 'bin'),
    '/usr/local/bin'
  ]

  const mac = platform() === 'darwin' ? ['/opt/homebrew/bin'] : []

  return [...common, ...mac, ...nodeVersionManagerDirs(home)]
}
