import { readFileSync } from 'fs'
import { join } from 'path'
import type { DetectedFinding } from '@domain/scan/detected-finding'
import { esFuente } from '@domain/scan/fuente'
import { runCommand } from './run-command'

const LIMIT = 400

function lineCount(projectPath: string, file: string): number {
  try {
    return readFileSync(join(projectPath, file), 'utf8').split('\n').length
  } catch {
    return 0
  }
}

/** Suma de marcas TODO/FIXME/HACK (git grep -c da "archivo:conteo" por linea). */
async function todoDebt(projectPath: string): Promise<number> {
  const grep = await runCommand('git', ['grep', '-IEc', 'TODO|FIXME|HACK'], projectPath)
  return grep.out
    .split('\n')
    .filter(Boolean)
    .reduce((sum, line) => sum + Number(line.split(':').pop() ?? 0), 0)
}

/** Probe de Mantenibilidad: archivos largos + deuda TODO/FIXME. Solo confianza. */
export async function maintainabilityProbe(projectPath: string): Promise<DetectedFinding[]> {
  const out: DetectedFinding[] = []
  const listed = await runCommand('git', ['ls-files'], projectPath)
  const files = listed.out.split('\n').filter(esFuente)
  const large = files.filter((file) => lineCount(projectPath, file) > LIMIT)
  for (const file of large.slice(0, 6)) {
    out.push({ severity: 'LOW', title: `Archivo largo (>${LIMIT} lineas)`, file, line: null })
  }
  if (large.length > 6) {
    out.push({
      severity: 'MEDIUM',
      title: `${large.length} archivos sobre ${LIMIT} lineas`,
      file: '',
      line: null
    })
  }
  const todos = await todoDebt(projectPath)
  if (todos > 20)
    out.push({
      severity: 'MEDIUM',
      title: `${todos} TODO/FIXME/HACK sin responsable`,
      file: '',
      line: null
    })
  else if (todos > 0)
    out.push({ severity: 'LOW', title: `${todos} TODO/FIXME/HACK`, file: '', line: null })
  return out
}
