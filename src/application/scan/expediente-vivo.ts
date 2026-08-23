import type { DetectedFinding } from '@domain/scan/detected-finding'
import type { FindingMemory } from '@domain/project/finding-memory'

/** El expediente vuelve a la forma que entienden COGNITION y el score. */
export function asDetected(memory: readonly FindingMemory[]): readonly DetectedFinding[] {
  return memory.map(({ severity, title, file, line }) => ({ severity, title, file, line }))
}
