import Database from 'better-sqlite3'
import { homedir } from 'os'
import { join } from 'path'
import { isActionable, isComplete } from '../src/domain/repair/analysis'
import { selectTarget, type Candidate } from '../src/domain/repair/select-target'
import { analyzeTarget } from '../src/application/repair/analyze-target'
import { createGraphAnalyst } from '../src/infrastructure/repair/graph-analyst'

const FCC = '/home/jojo/Escritorio/Raisen_FCC/fortress-command-center'
const CLAUDE = '/home/jojo/.nvm/versions/node/v24.18.0/bin/claude'

const db = new Database(join(homedir(), '.config/fortress-command-center/fortress.db'), {
  readonly: true
})
const p = db.prepare("SELECT id FROM projects WHERE name = 'fortress-command-center'").get() as {
  id: string
}
const rows = db
  .prepare(
    "SELECT id, severity, title, file, line FROM findings WHERE project_id = ? AND status = 'open'"
  )
  .all(p.id) as Candidate[]
const selection = selectTarget(rows)

async function main(): Promise<void> {
  if (!selection) return console.log('sin LOW para analizar')
  console.log(`C2 analiza: ${selection.target.file}:${selection.target.line} (grafo-primero)...`)
  const a = await analyzeTarget(createGraphAnalyst(CLAUDE, FCC), selection)
  console.log('\n=== C2 · ANALISIS (inerte, sin proponer fix) ===')
  console.log(`VEREDICTO:       ${a.status}  -> ${isActionable(a) ? 'C3 puede proponer' : 'OBSOLETO: extinguir + siguiente LOW'}`)
  console.log(`QUE CAMBIAR:     ${a.whatToChange}`)
  console.log(`DONDE:           ${a.where}`)
  console.log(`PATRON A COPIAR: ${a.patternToCopy}`)
  console.log(`NO TOCAR:        ${a.doNotTouch}`)
  console.log(`RIESGO:          ${a.risk}`)
  console.log(`\ncompleto (listo para C3): ${isComplete(a)} | tokens del grafo: ${a.tokensUsed}`)
}

void main()
