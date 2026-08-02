import { isSeverity, type Severity } from '../shared/severity'
import { isPatternStatus, type CognitionPattern, type PatternStatus } from './cognition-log'
import type { Section } from './sections'
import { isPlaceholder } from './template-guard'

/**
 * Exige digitos: la plantilla del log se titula "PTN-[ANO]-[NUMERO]" y sin
 * esta condicion entraria como si fuera un patron real registrado.
 */
const PTN = /^(PTN-\d{4}-\d+)\s*:\s*(.+)$/

function readField(body: string, label: string): string | null {
  const line = body.split('\n').find((entry) => entry.trim().startsWith(label))
  if (!line) return null

  const value = line.slice(line.indexOf(':') + 1).trim()
  return isPlaceholder(value) ? null : value
}

function readStatus(body: string): PatternStatus {
  const value = readField(body, 'Estado')
  // Sin estado legible se asume ACTIVE: dar por extinto lo que no se sabe
  // seria justo el error que este registro existe para evitar.
  return isPatternStatus(value) ? value : 'ACTIVE'
}

function readSeverity(body: string): Severity | null {
  const value = readField(body, 'Severidad')
  return isSeverity(value) ? value : null
}

function readRecurrences(body: string): number | null {
  const value = readField(body, 'Veces detectado')
  if (value === null) return null

  const parsed = Number.parseInt(value, 10)
  return Number.isFinite(parsed) ? parsed : null
}

export function parsePatterns(sections: readonly Section[]): readonly CognitionPattern[] {
  const found: CognitionPattern[] = []

  for (const section of sections) {
    const match = PTN.exec(section.heading.trim())
    if (!match) continue

    found.push({
      id: match[1],
      title: match[2].trim(),
      status: readStatus(section.body),
      severity: readSeverity(section.body),
      detectedAt:
        readField(section.body, 'Primera deteccion') ??
        readField(section.body, 'Primera detección'),
      recurrences: readRecurrences(section.body)
    })
  }

  return found
}
