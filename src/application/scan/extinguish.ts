import type { FileHistory } from '@domain/project/file-history'
import { findingIdentity } from '@domain/project/finding-identity'
import type { FindingMemory } from '@domain/project/finding-memory'
import type { DetectedFinding } from '@domain/scan/detected-finding'
import { extinguishable, unreported, type ExtinctionEvidence } from '@domain/scan/extinction'

export interface ExtinctionOutcome {
  /** Ausentes CON el archivo tocado: se extinguen, con evidencia. */
  readonly extinct: readonly FindingMemory[]
  /** Ausentes SIN tocar el archivo: siguen vivos, solo no se reportaron hoy. */
  readonly stillAlive: readonly FindingMemory[]
}

/** Solo se le pregunta a git por los AUSENTES: los reportados no piden prueba. */
async function touchedFiles(
  history: FileHistory,
  projectPath: string,
  absent: readonly FindingMemory[]
): Promise<ReadonlySet<string>> {
  const checked = await Promise.all(
    absent.map(async (f) =>
      (await history.changedSince(projectPath, f.file, f.firstSeen)) ? f.identity : null
    )
  )
  return new Set(checked.filter((id): id is string => id !== null))
}

/**
 * Reune la evidencia de las dos pruebas y reparte los ausentes en extintos y
 * vivos. No escribe nada: decide.
 */
export async function decideExtinctions(
  history: FileHistory,
  projectPath: string,
  memory: readonly FindingMemory[],
  reportedNow: readonly DetectedFinding[]
): Promise<ExtinctionOutcome> {
  const reported = new Set(reportedNow.map(findingIdentity))
  const absent = memory.filter((f) => f.lifecycle === 'ACTIVE' && !reported.has(f.identity))
  const evidence: ExtinctionEvidence = {
    reported,
    touched: await touchedFiles(history, projectPath, absent)
  }

  return {
    extinct: extinguishable(memory, evidence),
    stillAlive: unreported(memory, evidence)
  }
}

/** El expediente vuelve a la forma que entienden COGNITION y el score. */
export function asDetected(memory: readonly FindingMemory[]): readonly DetectedFinding[] {
  return memory.map(({ severity, title, file, line }) => ({ severity, title, file, line }))
}
