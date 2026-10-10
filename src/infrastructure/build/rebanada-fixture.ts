import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type { AppContext } from '@application/context'
import type { Proposal } from '@domain/repair/proposal'
import type { Db } from '../persistence/database'
import { createMemoryDb } from '../persistence/memory-db'
import { createProposalEventLog } from '../persistence/proposal-event-log'
import { createSqliteFindingRepository } from '../persistence/sqlite-finding-repository'
import { createSqliteOmegaLog } from '../persistence/sqlite-omega-log'
import { createSqliteProjectRepository } from '../persistence/sqlite-project-repository'
import { createSqliteProposalEventRepository } from '../persistence/sqlite-proposal-event-repository'
import { createSqliteRepairProposalRepository } from '../persistence/sqlite-repair-proposal-repository'

export interface DosProyectos {
  readonly ctx: AppContext
  readonly db: Db
  limpiar(): void
}

/**
 * Dos proyectos REALES (a1=ALFA, b1=BETA) con libro de vida distinto sobre una
 * base de memoria y dos directorios de verdad: la unica forma de probar que la
 * rebanada de B jamas ve a A es que A exista entero al lado (Leccion 136: la
 * custodia se prueba, no se promete).
 */
export function contextoConDosProyectos(): DosProyectos {
  const db = createMemoryDb()
  const ctx = {
    projects: createSqliteProjectRepository(db),
    findings: createSqliteFindingRepository(db),
    omegaLog: createSqliteOmegaLog(db),
    repairProposals: createSqliteRepairProposalRepository(db),
    eventLog: createProposalEventLog(createSqliteProposalEventRepository(db))
  } as unknown as AppContext
  const dirs = [sembrar(db, ctx, 'a1', 'ALFA'), sembrar(db, ctx, 'b1', 'BETA')]
  return { ctx, db, limpiar: () => dirs.forEach((d) => rmSync(d, { recursive: true, force: true })) } // prettier-ignore
}

/** Siembra un proyecto entero: cada fuente del libro lleva la MARCA en su texto. */
function sembrar(db: Db, ctx: AppContext, id: string, marca: string): string {
  const dir = mkdtempSync(join(tmpdir(), `rebanada-${id}-`))
  db.prepare("INSERT INTO projects (id, name, path, created_at) VALUES (?, ?, ?, '2026-10-01')").run(id, marca, dir) // prettier-ignore
  const finding = db.prepare(
    "INSERT INTO findings (id, project_id, severity, title, created_at) VALUES (?, ?, 'HIGH', ?, '2026-10-01')"
  )
  finding.run(`v-${id}`, id, `vivo-${marca}`)
  finding.run(`x-${id}`, id, `extinto-${marca}`)
  db.prepare("UPDATE findings SET lifecycle = 'EXTINCT' WHERE id = ?").run(`x-${id}`)
  ctx.omegaLog.append({ projectId: id, agentId: null, kind: 'nota', verdict: 'info', summary: `asiento-${marca}`, evidence: '' }) // prettier-ignore
  ctx.repairProposals.insert({ id: `p-${id}`, projectId: id, findingId: `hallazgo-${marca}`, baseSha: 'sha', state: 'ELEGIDO', createdAt: 1, updatedAt: 1 } as Proposal) // prettier-ignore
  void ctx.eventLog.record({ id: `e-${id}`, proposalId: `p-${id}`, seq: 1, phase: 'SELECT', eventType: 'TRANSITION', actor: 'motor', ts: 1 }) // prettier-ignore
  writeFileSync(join(dir, 'COGNITION-LOG.md'), `## PTN-2026-001: patron-${marca}\n\nEstado: ACTIVE\nSeveridad: HIGH\nVeces detectado: 1\n`) // prettier-ignore
  writeFileSync(join(dir, `INFORME-${marca}.md`), marca)
  return dir
}
