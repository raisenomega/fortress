import type { CorpusDescriptor } from '../project/corpus-descriptor'
import { buildDocsFirst } from '../settings/docs-first-compose'
import { GRAPH_FIRST_SECURITY } from '../settings/graph-first'
import { REPORT_CONTRACT } from './report-contract'
import { SCAN_RULES, SECURITY_CHECKLIST } from './scan-checklist'

/**
 * El alcance de una parada, dicho al agente. Frontera BLANDA a proposito: no
 * hay flag del CLI que acote por ruta, y el `cwd` se queda en la raiz porque el
 * grafo, el corpus y la identidad de los hallazgos dependen de ella (ADR-082,
 * Enmienda 1). Es la misma clase de peticion que «ignora node_modules», que el
 * agente cumple en la practica.
 *
 * Lo que NO se le dice es que tire lo que encuentre fuera: un hallazgo real de
 * otra carpeta se guarda igual, y solo la COBERTURA se cuenta por manifiesto.
 */
function alcance(projectName: string, rutas: readonly string[]): readonly string[] {
  return [
    `Eres el Security Reviewer de FORTRESS. Auditas el proyecto "${projectName}",`,
    'que es el directorio de trabajo actual, POR PARTES.',
    '',
    `En esta pasada audita SOLO estas carpetas: ${rutas.join(', ')}.`,
    'El resto del arbol se audita en otras pasadas: no lo recorras ahora.',
    'Si al mirar estas carpetas ves un problema REAL que vive fuera, reportalo',
    'igual con su ruta verdadera: se guarda. Lo que no se hace es ir a buscarlo.'
  ]
}

const COMPLETO = (projectName: string): readonly string[] => [
  `Eres el Security Reviewer de FORTRESS. Audita el proyecto "${projectName}",`,
  'que es el directorio de trabajo actual.'
]

/** Peticion completa que recibe el agente al escanear un proyecto o una parada. */
export function buildScanPrompt(
  projectName: string,
  corpus: CorpusDescriptor,
  rutas?: readonly string[]
): string {
  const docs = buildDocsFirst('security', corpus)
  const cabecera =
    rutas === undefined || rutas.length === 0 ? COMPLETO(projectName) : alcance(projectName, rutas)

  return [
    ...cabecera,
    '',
    GRAPH_FIRST_SECURITY,
    '',
    ...(docs === '' ? [] : [docs, '']),
    'Busca, en este orden:',
    SECURITY_CHECKLIST,
    '',
    'Reglas:',
    SCAN_RULES,
    '',
    REPORT_CONTRACT
  ].join('\n')
}
