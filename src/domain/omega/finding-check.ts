import type { Finding } from '../project/project'
import type { OmegaVerdict } from './omega-entry'

/** Lo que la infraestructura averigua del archivo citado por un hallazgo. */
export interface FileProbe {
  readonly exists: boolean
  readonly lineCount: number
}

export interface FindingCheck {
  readonly verdict: OmegaVerdict
  readonly summary: string
  readonly evidence: string
}

/**
 * Contrasta un hallazgo contra el filesystem. Puro: recibe lo que el disco dice
 * (FileProbe) y decide. 'discrepancia' SOLO con prueba: el archivo no existe o
 * la linea esta fuera de rango. La intencion nunca se juzga; solo lo verificable.
 */
export function checkFinding(finding: Finding, probe: FileProbe): FindingCheck {
  const loc = finding.line === null ? finding.file : `${finding.file}:${finding.line}`

  if (finding.file.trim() === '') {
    return {
      verdict: 'info',
      summary: `"${finding.title}" no cita archivo: no verificable`,
      evidence: ''
    }
  }
  if (!probe.exists) {
    return {
      verdict: 'discrepancia',
      summary: `Reporto "${finding.title}" en ${finding.file}, pero el archivo no existe`,
      evidence: loc
    }
  }
  if (finding.line !== null && finding.line > probe.lineCount) {
    return {
      verdict: 'discrepancia',
      summary: `Reporto ${loc}, pero el archivo tiene ${probe.lineCount} lineas`,
      evidence: loc
    }
  }
  return { verdict: 'ok', summary: `Verificado: ${loc} existe en disco`, evidence: loc }
}
