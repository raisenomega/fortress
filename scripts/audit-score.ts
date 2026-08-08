import Database from 'better-sqlite3'
import { homedir } from 'os'
import { join } from 'path'
import { DIMENSIONS } from '../src/domain/score/dimension'
import { auditQuality } from '../src/infrastructure/probe/audit-quality'
import type { HasSeverity } from '../src/domain/shared/severity'

const path = process.argv[2]
if (!path) {
  console.error('uso: tsx audit-score.ts <ruta>')
  process.exit(1)
}

/** Seguridad = los hallazgos abiertos del ultimo escaneo persistido (reusa el scan). */
function securityFindings(projectPath: string): HasSeverity[] | null {
  try {
    const db = new Database(join(homedir(), '.config/fortress-command-center/fortress.db'), {
      readonly: true
    })
    const project = db.prepare('SELECT id FROM projects WHERE path = ?').get(projectPath) as
      { id: string } | undefined
    if (!project) return null
    const rows = db
      .prepare("SELECT severity FROM findings WHERE project_id = ? AND status = 'open'")
      .all(project.id) as HasSeverity[]
    db.close()
    return rows
  } catch {
    return null
  }
}

async function main(): Promise<void> {
  const audit = await auditQuality(path, true, securityFindings(path))
  const s = audit.score

  console.log(`\n=== ${path} ===`)
  console.log(`GLOBAL: ${s.global}${s.partial ? '  (PARCIAL)' : ''}`)
  for (const d of s.byDimension) {
    const val = d.score === null ? 'sin datos' : String(d.score).padStart(3)
    console.log(`  ${d.label.padEnd(15)} ${val}   (${d.count} hallazgos)`)
  }
  console.log(`  faltan: ${s.missing.join(', ') || '(ninguna)'}`)
  const g = audit.integrity
  console.log(`  CAPA 3 integridad: ${g.clean ? 'LIMPIO (byte-identico)' : 'CONTAMINADO'}`)
  for (const v of g.violations.slice(0, 10)) console.log(`    ! ${v.kind} ${v.path}`)

  for (const dim of DIMENSIONS) {
    const input = audit.inputs[dim.key]
    if (Array.isArray(input) && input.length > 0) {
      console.log(`\n  ${dim.label}:`)
      for (const finding of input as { severity: string; title: string }[]) {
        console.log(`    [${finding.severity}] ${finding.title}`)
      }
    }
  }
}

void main()
