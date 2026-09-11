import type { CodeAgent } from '@domain/chat/code-agent'
import { buildJuicioPrompt } from '@domain/scan/juicio-prompt'
import { parseJuicio } from '@domain/scan/juicio-parse'
import type { ModuloAuditoria } from '@domain/scan/modulo-auditoria'
import type { VeredictoAplicabilidad } from '@domain/scan/veredicto-de-aplicabilidad'

/** Lo que `medirProyecto` puede pedir cuando la cascada no resolvio sola. */
export type Juez = (
  projectPath: string,
  modulos: readonly ModuloAuditoria[],
  carpetas: readonly string[]
) => Promise<readonly VeredictoAplicabilidad[]>

/** Sin juez no hay juicio, y los pendientes quedan en «no consta»: el mismo
 *  sitio donde estaban antes de que esta fase existiera. */
export const SIN_JUEZ: Juez = () => Promise.resolve([])

/**
 * El clasificador de ADR-083, Fase 4: un agente decide si M8 y M3 le tocan a
 * este proyecto, y lo respalda con una cita de codigo.
 *
 * En modo PLAN, como el escaner y por lo mismo: clasificar es mirar. Y
 * `trusted: false` siempre —no se autoverifica nada— porque esto corre antes
 * de auditar, sobre codigo del que aun no se sabe nada.
 *
 * Un fallo del proceso NO revienta el escaneo: devuelve lista vacia y la
 * cascada deja esos modulos en «no consta», que es la verdad. Perder el juicio
 * cuesta profundidad; tumbar el escaneo por perderlo costaria el escaneo.
 */
export function crearJuez(
  codeAgent: CodeAgent,
  onVeredicto: (veredicto: VeredictoAplicabilidad) => void = () => undefined
): Juez {
  return async (projectPath, modulos, carpetas) => {
    const reply = await codeAgent.run(
      {
        projectPath,
        prompt: buildJuicioPrompt(modulos, carpetas),
        permissionMode: 'plan',
        agentId: 'scope-classifier',
        trusted: false
      },
      () => undefined
    )
    if (reply.failed) return []

    const veredictos = parseJuicio(reply.text)
    veredictos.forEach(onVeredicto)
    return veredictos
  }
}
