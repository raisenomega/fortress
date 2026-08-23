import { err, ok, type Result } from '../shared/result'
import { isSeverity } from '../shared/severity'
import type { DetectedFinding } from './detected-finding'
import { aTipoDeDefecto } from './tipo-de-defecto'

const JSON_FENCE = /```json\s*([\s\S]*?)```/g

/**
 * Un informe que no se entiende NO es un proyecto limpio. Devolver una lista
 * vacia aqui pintaria un 100/100 sobre un escaneo que en realidad fallo, que
 * es la peor mentira que podria contar esta app.
 */
const UNREADABLE =
  'El escaneo termino pero no devolvio un informe legible, asi que no se guarda ' +
  'ningun resultado. Vuelve a intentarlo.'

/** El informe va al final, pero el agente puede citar JSON antes: gana el ultimo. */
function lastJsonBlock(output: string): string | null {
  const blocks = [...output.matchAll(JSON_FENCE)].map((match) => match[1].trim())
  return blocks.at(-1) ?? null
}

/** Descarta entradas incompletas en vez de tumbar el informe entero. */
function toFinding(entry: unknown): DetectedFinding | null {
  if (typeof entry !== 'object' || entry === null) return null
  const raw = entry as Record<string, unknown>

  if (!isSeverity(raw.severity)) return null
  if (typeof raw.title !== 'string' || raw.title.trim() === '') return null

  const line = typeof raw.line === 'number' && Number.isFinite(raw.line) ? raw.line : null

  // Un tipo fuera del vocabulario cae a `otro` y un simbolo ausente queda
  // vacio: no se inventa ninguno de los dos, y el escaneo no se tira por eso.
  return {
    severity: raw.severity,
    title: raw.title.trim(),
    file: typeof raw.file === 'string' ? raw.file : '',
    line: line === null ? null : Math.trunc(line),
    tipo: aTipoDeDefecto(raw.tipo),
    simbolo: typeof raw.simbolo === 'string' ? raw.simbolo.trim() : ''
  }
}

export function parseScanOutput(output: string): Result<readonly DetectedFinding[]> {
  const block = lastJsonBlock(output)
  if (block === null) return err(UNREADABLE)

  let parsed: unknown
  try {
    parsed = JSON.parse(block)
  } catch {
    return err(UNREADABLE)
  }

  const list = (parsed as { findings?: unknown } | null)?.findings
  if (!Array.isArray(list)) return err(UNREADABLE)

  return ok(list.map(toFinding).filter((finding): finding is DetectedFinding => finding !== null))
}
