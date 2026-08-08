import { relative } from 'path'
import type { IntegrityReport, Violation } from '@domain/probe/integrity'
import { listFiles } from './list-files'
import { sha256, type Snapshot } from './snapshot'

/**
 * CAPA 3 — verificacion INDEPENDIENTE: re-hashea TODOS los archivos desde cero y
 * compara contra la foto de la Capa 1. El guard no se cree a si mismo: se re-mide.
 * Cualquier diferencia (creado / modificado / borrado) es una violacion forense.
 */
export function verify(projectPath: string, snap: Snapshot): IntegrityReport {
  const violations: Violation[] = []
  const seen = new Set<string>()
  for (const file of listFiles(projectPath)) {
    const rel = relative(projectPath, file)
    seen.add(rel)
    const before = snap.hashes.get(rel) ?? null
    const after = sha256(file)
    if (before === null) violations.push({ path: rel, kind: 'created', before: null, after })
    else if (before !== after) violations.push({ path: rel, kind: 'modified', before, after })
  }
  for (const [rel, before] of snap.hashes) {
    if (!seen.has(rel)) violations.push({ path: rel, kind: 'deleted', before, after: null })
  }
  return { clean: violations.length === 0, violations }
}
