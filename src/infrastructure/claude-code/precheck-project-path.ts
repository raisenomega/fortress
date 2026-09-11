import { existsSync, statSync } from 'fs'

/** La carpeta del proyecto tiene que existir y ser una carpeta antes de spawnear. */
export function precheckProjectPath(projectPath: string): string | null {
  try {
    if (statSync(projectPath).isDirectory()) return null
    return `La ruta del proyecto no es una carpeta: ${projectPath}`
  } catch {
    return existsSync(projectPath)
      ? `No se puede acceder a la carpeta del proyecto: ${projectPath}`
      : `La carpeta del proyecto ya no existe: ${projectPath}`
  }
}
