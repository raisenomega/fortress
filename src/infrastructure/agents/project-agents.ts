import { readdirSync } from 'fs'
import { join } from 'path'

/**
 * Agentes que el propio proyecto define en .claude/agents. FORTRESS no los
 * pisa: si el operador escribio su version de `security-reviewer`, la suya
 * manda. Inyectar la nuestra encima seria cambiarle el comportamiento de su
 * repositorio sin avisar.
 */
export function projectAgentIds(projectPath: string): ReadonlySet<string> {
  try {
    const names = readdirSync(join(projectPath, '.claude', 'agents'))
      .filter((file) => file.endsWith('.md'))
      .map((file) => file.slice(0, -'.md'.length))

    return new Set(names)
  } catch {
    // Lo normal es que la carpeta no exista; no es un error.
    return new Set()
  }
}
