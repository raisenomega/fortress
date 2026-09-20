import type { CodeAgent } from '@domain/chat/code-agent'
import { buildJuicioPrompt } from '@domain/scan/juicio-prompt'
import { parseJuicio } from '@domain/scan/juicio-parse'
import { notasDeBloque } from '@domain/system/extraer-notas'
import type { SelfNoteDraft } from '@domain/system/self-observation'
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
 * En LECTURA y no en `plan`: aquel BLOQUEA todas las llamadas MCP, asi que el
 * grafo nunca respondia y este juez clasificaba el alcance sin ver el mapa —«no
 * se pudo ni comprobar si el proyecto estaba indexado», anotado por el propio
 * agente en CUATRO proyectos distintos—. `lectura` corre en `default` con solo
 * tools de lectura: el grafo contesta y no se edita.
 *
 * Y APRIETA por `--disallowedTools Bash`, NO por el allowlist —eso lo afirme al
 * traer este modo y era falso: aquel solo pre-aprueba y Bash corria igual—.
 * Hacia falta: el prompt pide «no edites ni ejecutes nada» desde el 10-sep y sus
 * CUATRO corridas siguientes usaron Bash 30-63 veces. `trusted: false` igual.
 *
 * Un fallo del proceso NO revienta el escaneo: devuelve lista vacia y la
 * cascada deja esos modulos en «no consta», que es la verdad. Perder el juicio
 * cuesta profundidad; tumbar el escaneo por perderlo costaria el escaneo.
 */
export function crearJuez(
  codeAgent: CodeAgent,
  /**
   * De quien es el proceso. NO es opcional desde que el escaneo corre sin techo
   * (ADR-082, Enmienda 3): `trackChild` registra al hijo con este id y
   * `killChildrenOf` solo alcanza a los que lo llevan. Sin el, un juez colgado
   * no lo mataba ni el reloj —que ya no existe— ni Detener.
   */
  projectId: string,
  onVeredicto: (veredicto: VeredictoAplicabilidad) => void = () => undefined,
  /** Lo que noto de FORTRESS, en su SEGUNDO bloque (ADR-085): su payload es un
   *  array y no hay clave hermana donde colgarlo. */
  onNotas: (notas: readonly SelfNoteDraft[]) => void = () => undefined
): Juez {
  return async (projectPath, modulos, carpetas) => {
    const reply = await codeAgent.run(
      {
        projectPath,
        projectId,
        prompt: buildJuicioPrompt(modulos, carpetas),
        permissionMode: 'lectura',
        agentId: 'scope-classifier',
        trusted: false
      },
      () => undefined
    )
    if (reply.failed) return []

    // Las notas ANTES del veredicto: son independientes, y un juicio vacio
    // —que es lo normal cuando el modelo no encuentra con que respaldar— no
    // puede llevarse por delante lo que el agente si supo decir de FORTRESS.
    onNotas(notasDeBloque(reply.text))
    const veredictos = parseJuicio(reply.text)
    veredictos.forEach(onVeredicto)
    return veredictos
  }
}
