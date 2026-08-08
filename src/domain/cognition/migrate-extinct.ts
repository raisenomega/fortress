import { isSeverity, type Severity } from '../shared/severity'
import { patternId } from './pattern-id'

const HEADING = /^## PTN-(\d{4})-\d+\s*:\s*(.+)$/
/** Los EXTINTOS guardan el archivo dentro de la evidencia, no en un campo. */
const ORIGEN = /ubicacion original\s+(\S+):(?:\d+|-)\)/

function readSeverity(body: string): Severity | null {
  const line = body.split('\n').find((entry) => entry.trim().startsWith('Severidad'))
  const value = line?.slice(line.indexOf(':') + 1).trim()
  return isSeverity(value) ? value : null
}

/**
 * Reescribe el id de UNA entrada extinta. Conserva el ano con el que quedo
 * registrada (es su historia, no se reinventa) y deja el cuerpo byte a byte.
 * Si le falta severidad o ubicacion no se puede derivar el id estable: la
 * entrada se devuelve intacta antes que corromperla.
 */
function migrateEntry(chunk: string): string {
  const cut = chunk.indexOf('\n')
  const heading = cut === -1 ? chunk : chunk.slice(0, cut)
  const body = cut === -1 ? '' : chunk.slice(cut)

  const match = HEADING.exec(heading.trim())
  if (!match) return chunk

  const [, year, title] = match
  const severity = readSeverity(body)
  const file = ORIGEN.exec(body)?.[1]
  if (severity === null || file === undefined) return chunk

  return `## ${patternId({ severity, file, title }, year)}: ${title}${body}`
}

/**
 * MIGRACION de los extintos ya acumulados: cambia los ids posicionales por los
 * estables sin perder ninguna entrada.
 *
 * Es lo que resuelve la colision real del log: los extintos se numeraban
 * `900 + indice` sobre CADA tanda de resueltos, asi que cada escaneo con
 * resueltos volvia a empezar en 900 y tres entradas distintas acabaron
 * compartiendo `PTN-2026-900`. Derivado del contenido, cada una tiene el suyo.
 */
export function migrateExtinct(text: string): string {
  return text
    .split(/^(?=## )/m)
    .map(migrateEntry)
    .join('')
}
