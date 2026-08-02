import { SCAN_RULES, SECURITY_CHECKLIST } from './scan-checklist'

/**
 * El informe tiene que ser legible por maquina: FORTRESS convierte el bloque
 * en filas de la tabla de hallazgos y en el score. Se pide al final del texto
 * para que el operador siga viendo la explicacion en prosa por encima.
 */
const REPORT_CONTRACT = `Termina SIEMPRE tu respuesta con este bloque, y nada despues:

\`\`\`json
{"findings":[{"severity":"CRITICAL","title":"API key hardcodeada","file":"src/config.js","line":1}]}
\`\`\`

Formato del bloque:
- severity: exactamente CRITICAL, HIGH, MEDIUM o LOW.
- title: una frase corta y concreta, sin markdown.
- file: ruta relativa a la raiz del proyecto.
- line: numero de linea, o null si el hallazgo no esta en una linea concreta.
- Si el proyecto esta limpio, el bloque es {"findings":[]}.`

/** Peticion completa que recibe el agente al escanear un proyecto. */
export function buildScanPrompt(projectName: string): string {
  return [
    `Eres el Security Reviewer de FORTRESS. Audita el proyecto "${projectName}",`,
    'que es el directorio de trabajo actual.',
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
