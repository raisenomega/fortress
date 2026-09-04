import { findingIdentity } from '@domain/project/finding-identity'
import type { DetectedFinding } from '@domain/scan/detected-finding'
import { PROJECT, type Bench } from './finding-fixture'
import { createFindingFusion } from './finding-fusion'

/** El defecto real de la correa de alcance, en el formato de hoy. */
export const CORREA: DetectedFinding = {
  severity: 'HIGH', title: 'La correa de alcance acepta rutas con .. y absolutas',
  file: 'src/domain/repair/allowed-files.ts', line: 12,
  tipo: 'path-traversal', simbolo: 'computeAllowedFiles'
} // prettier-ignore

interface Fila {
  readonly id: string
  readonly identidad: string
  readonly firstSeen: string
  tipo: 'path-traversal'
  simbolo: 'handleverify'
}

/**
 * El escenario que motivo la pieza: dos filas con la identidad de ANTES de
 * cp116 —severidad|fichero|titulo— y una tercera que un escaneo de hoy abrio
 * para el mismo defecto, porque aquellas dos no podian empatar con esta.
 */
export function conLasTresFilas(bench: Bench): void {
  const vieja = (id: string, titulo: string, at: string): void => {
    // prettier-ignore
    bench.db.prepare(
      `INSERT INTO findings (id, project_id, severity, title, file, line, created_at,
        identity, tipo, simbolo, lifecycle, first_seen, last_seen)
       VALUES (?, ?, 'MEDIUM', ?, ?, 12, ?, ?, 'otro', '', 'ACTIVE', ?, ?)`
    ).run(id, PROJECT, titulo, CORREA.file, at, `MEDIUM|${CORREA.file}|${titulo}`, at, at)
  }
  vieja('vieja', 'La correa computeAllowedFiles acepta rutas con ..', '2026-07-01T00:00:00Z')
  vieja('media', 'La correa de archivos permitidos acepta rutas con ..', '2026-08-09T00:00:00Z')
  bench.repo.syncFromScan(PROJECT, 's1', [CORREA], '2026-08-23T00:00:00Z', new Set())
}

/** Lo que hara la Pieza 2: reclasificar las viejas y fusionar lo que empate. */
export function reclasificarYFusionar(bench: Bench): number {
  const fusion = createFindingFusion(bench.db)
  const identidad = findingIdentity(CORREA)
  const reclasificada = { identidad, tipo: 'path-traversal', simbolo: 'computeAllowedFiles' }
  // prettier-ignore
  fusion.reclasificar([{ id: 'vieja', ...reclasificada }, { id: 'media', ...reclasificada }])

  // prettier-ignore
  const vivas = bench.db.prepare(
    `SELECT id, identity AS identidad, first_seen AS firstSeen FROM findings
     WHERE project_id = ? AND lifecycle != 'EXTINCT'`
  ).all(PROJECT) as Fila[]
  return fusion.fusionar(vivas)
}

export const memoria = (bench: Bench, id: string): Record<string, unknown> =>
  bench.db.prepare('SELECT * FROM findings WHERE id = ?').get(id) as Record<string, unknown>
