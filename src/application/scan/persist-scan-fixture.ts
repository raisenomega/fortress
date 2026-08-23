import type { FindingMemory } from '@domain/project/finding-memory'
import type { AppContext } from '../context'

export interface Guardado {
  score?: number
  extinct?: readonly string[]
  fila?: { findingCount: number; dossierCount: number }
}

/** Expediente minimo: dos ausentes, uno con su archivo intacto y otro tocado. */
export function memoria(): FindingMemory[] {
  const base = { line: 1, status: 'open' as const, lifecycle: 'ACTIVE' as const }
  const fechas = { firstSeen: '2026-08-08T10:00:00Z', lastSeen: '2026-08-08T10:00:00Z' }
  return [
    { ...base, ...fechas, id: 'f1', identity: 'HIGH|vivo.ts|sigue vivo', severity: 'HIGH', title: 'sigue vivo', file: 'vivo.ts', resolvedAt: null, mitigatedAt: null }, // prettier-ignore
    { ...base, ...fechas, id: 'f2', identity: 'HIGH|tocado.ts|con su archivo tocado', severity: 'HIGH', title: 'con su archivo tocado', file: 'tocado.ts', resolvedAt: null, mitigatedAt: null } // prettier-ignore
  ]
}

/** Contexto falso: git dice que SOLO tocado.ts cambio — dato que ya no extingue. */
export function fixture(saved: Guardado): AppContext {
  return {
    fileHistory: { changedSince: (_p: string, file: string) => Promise.resolve(file === 'tocado.ts') }, // prettier-ignore
    findings: {
      listMemory: () => memoria(),
      syncFromScan: (): void => undefined,
      markExtinct: (ids: readonly string[]): void => void (saved.extinct = ids)
    },
    transaction: (fn: () => void): void => fn(),
    scans: { record: (fila: Guardado['fila']) => ((saved.fila = fila), { id: 's1' }) },
    projects: { updateScan: (_id: string, score: number): void => void (saved.score = score) },
    runs: { record: (): void => undefined },
    activity: { recordMany: (): void => undefined },
    cognitionWriter: { writeScan: (): void => undefined }
  } as unknown as AppContext
}
