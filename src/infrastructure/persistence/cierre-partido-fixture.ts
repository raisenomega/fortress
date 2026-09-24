import { createSqliteParadaRunRepository } from './sqlite-parada-run-repository'
import type { AppContext } from '@application/context'
import { SIN_BARRERAS } from '@domain/project/barreras-declaradas'
import type { Project } from '@domain/project/project'
import type { DetectedFinding } from '@domain/scan/detected-finding'
import type { ScanOutcome } from '@domain/scan/scanner'
import { consultasDe, type Consultas } from './bench-consultas'
import type { Db } from './database'
import { createMemoryDb, seedProject } from './memory-db'
import { createSqliteActivityRepository } from './sqlite-activity-repository'
import { createSqliteAgentRunRepository } from './sqlite-agent-run-repository'
import { createSqliteFindingRepository } from './sqlite-finding-repository'
import { createSqliteProjectRepository } from './sqlite-project-repository'
import { createSqliteScanHistoryRepository } from './sqlite-scan-history-repository'

export const PROYECTO = 'p1'
export const PROJECT = { id: PROYECTO, path: '/tmp/p1', name: 'p1' } as Project

// prettier-ignore
export const SIN_FACTURA = { inputTokens: 0, outputTokens: 0, cacheReadTokens: 0, cacheCreationTokens: 0, costUsd: 0, numTurns: 0 }

export function corrida(findings: readonly DetectedFinding[]): ScanOutcome {
  return {
    findings,
    durationMs: 1234,
    usage: SIN_FACTURA,
    tools: [],
    edits: [],
    texto: '',
    notas: []
  }
}

export interface Bench extends Consultas {
  readonly db: Db
  readonly context: AppContext
  /** Cuantas veces se escribio la memoria del proyecto (COGNITION). */
  escrituras(): number
}

/**
 * Contexto sobre SQLite REAL: los cinco repositorios que el cierre toca son los
 * de verdad, no dobles. Es lo que hace que el test de equivalencia signifique
 * algo — compara filas escritas, no llamadas contadas.
 *
 * Solo `fileHistory` y `cognitionWriter` son falsos: uno seria git y el otro un
 * fichero en disco, y ninguno de los dos es lo que se esta probando aqui.
 */
export function crearBench(): Bench {
  const db = createMemoryDb()
  seedProject(db, PROYECTO)
  let escrituras = 0

  const context = {
    projects: createSqliteProjectRepository(db),
    findings: createSqliteFindingRepository(db),
    scans: createSqliteScanHistoryRepository(db),
    activity: createSqliteActivityRepository(db),
    runs: createSqliteAgentRunRepository(db),
    paradaRuns: createSqliteParadaRunRepository(db),
    fileHistory: { changedSince: () => Promise.resolve(false) },
    cognitionWriter: { writeScan: (): void => void (escrituras += 1) },
    informeWriter: { write: (): void => undefined },
    // El banco no tiene repo git: null es la verdad, y el informe la dice.
    headSha: () => null,
    barrerasDeclaradas: () => SIN_BARRERAS,
    transaction: (work: () => void) => db.transaction(work)()
  } as unknown as AppContext

  return { db, context, escrituras: () => escrituras, ...consultasDe(db) }
}
