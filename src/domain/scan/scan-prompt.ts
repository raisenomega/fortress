import { GRAPH_FIRST_SECURITY } from '../settings/graph-first'
import { REPORT_CONTRACT } from './report-contract'
import { SCAN_RULES, SECURITY_CHECKLIST } from './scan-checklist'

/** Peticion completa que recibe el agente al escanear un proyecto. */
export function buildScanPrompt(projectName: string): string {
  return [
    `Eres el Security Reviewer de FORTRESS. Audita el proyecto "${projectName}",`,
    'que es el directorio de trabajo actual.',
    '',
    GRAPH_FIRST_SECURITY,
    '',
    'Busca, en este orden:',
    SECURITY_CHECKLIST,
    '',
    'Reglas:',
    SCAN_RULES,
    '',
    REPORT_CONTRACT
  ].join('\n')
}
