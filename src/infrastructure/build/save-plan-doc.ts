import { writeFileSync } from 'fs'
import { rutaContenida } from '../fs/ruta-contenida'
import { planDocument } from '@domain/build/plan-document'

/**
 * Guarda el plan como FORTRESS-PLAN-<fecha>.md en la raiz del proyecto y devuelve
 * la ruta, o null si el escritura falla (el plan no se pierde: ya va en el chat).
 * Con fecha en el nombre no se pisan planes anteriores.
 */
export function savePlanDoc(
  projectPath: string,
  projectName: string,
  intent: string,
  plan: string,
  whenIso: string
): string | null {
  try {
    const stamp = whenIso.slice(0, 19).replace(/[:T]/g, '-')
    const path = rutaContenida(projectPath, `FORTRESS-PLAN-${stamp}.md`)
    if (path === null) return null
    writeFileSync(path, planDocument(projectName, intent, plan, whenIso), 'utf8')
    return path
  } catch {
    return null
  }
}
