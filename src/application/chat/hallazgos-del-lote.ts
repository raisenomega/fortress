import type { FindingMemory } from '@domain/project/finding-memory'
import { sanearParaPrompt } from '@domain/shared/sanear-para-prompt'
import type { AppContext } from '../context'
import { vivo } from '../repair/elegir-objetivo'

/** Lo minimo para escribir la linea de un hallazgo; lo cumplen la fila y la memoria. */
interface ParaLaLinea {
  readonly severity: string
  readonly file: string
  readonly line: number | null
  readonly title: string
}

/** Una linea por hallazgo: severidad, sitio y titulo. La MISMA forma que la
 *  lista de escaneos anteriores, escrita una sola vez. */
export function lineaDelHallazgo(f: ParaLaLinea): string {
  const loc = `${f.file}${f.line === null ? '' : `:${f.line}`}`
  return sanearParaPrompt(`${f.severity} ${loc} — ${f.title}`)
}

/**
 * Los hallazgos del LOTE, releidos de la base (ADR-088, arco 1). Del renderer
 * solo se aceptan los ids, como con el foco: que existan, sean de ESTE proyecto
 * y sigan vivos lo dice la base.
 *
 * `excepto` deja fuera al del foco: en un turno de resolucion, la lista son sus
 * HERMANOS. En el turno de plan no se excluye a nadie, porque no hay foco.
 */
export function lineasDelLote(
  context: AppContext,
  projectId: string,
  ids: readonly string[],
  excepto?: string
): readonly string[] {
  if (ids.length === 0) return []
  const memoria = context.findings.listMemory(projectId)
  return ids
    .filter((id) => id !== excepto)
    .map((id) => memoria.find((f) => f.id === id))
    .filter((f): f is FindingMemory => f !== undefined && vivo(f))
    .map(lineaDelHallazgo)
}
