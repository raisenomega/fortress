import { existsSync } from 'fs'
import { join } from 'path'
import { auditFindings, type AuditCounts } from '@domain/score/audit-rules'
import type { DetectedFinding } from '@domain/scan/detected-finding'
import { runCommand } from './run-command'

const ZERO: AuditCounts = { critical: 0, high: 0, moderate: 0, low: 0 }

/** Lee el resumen de `npm audit --json` (metadata.vulnerabilities). */
function parseAudit(out: string): AuditCounts {
  try {
    const data = JSON.parse(out) as { metadata?: { vulnerabilities?: Partial<AuditCounts> } }
    return { ...ZERO, ...(data.metadata?.vulnerabilities ?? {}) }
  } catch {
    return ZERO
  }
}

/** Probe de Dependencias: `npm audit` por severidad. Solo confianza. */
export async function dependenciesProbe(projectPath: string): Promise<DetectedFinding[]> {
  if (!existsSync(join(projectPath, 'package.json'))) return []
  const result = await runCommand('npm', ['audit', '--json'], projectPath)
  return auditFindings(parseAudit(result.out))
}
