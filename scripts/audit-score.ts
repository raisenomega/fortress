import { DIMENSIONS } from '../src/domain/score/dimension'
import { auditQuality } from '../src/infrastructure/probe/audit-quality'

const path = process.argv[2]
if (!path) {
  console.error('uso: tsx audit-score.ts <ruta>')
  process.exit(1)
}

// trusted=true; seguridad sin datos (no corremos el scan de agente aqui).
const audit = auditQuality(path, true, null)
const s = audit.score

console.log(`\n=== ${path} ===`)
console.log(`GLOBAL: ${s.global}${s.partial ? '  (PARCIAL)' : ''}`)
for (const d of s.byDimension) {
  const val = d.score === null ? 'sin datos' : String(d.score).padStart(3)
  console.log(`  ${d.label.padEnd(15)} ${val}   (${d.count} hallazgos)`)
}
console.log(`  faltan: ${s.missing.join(', ') || '(ninguna)'}`)

for (const dim of DIMENSIONS) {
  const input = audit.inputs[dim.key]
  if (Array.isArray(input) && input.length > 0) {
    console.log(`\n  ${dim.label}:`)
    for (const finding of input as { severity: string; title: string }[]) {
      console.log(`    [${finding.severity}] ${finding.title}`)
    }
  }
}
