import type { CorpusDescriptor } from '../project/corpus-descriptor'
import { buildDocsFirst } from '../settings/docs-first-compose'
import { GRAPH_FIRST_SECURITY } from '../settings/graph-first'
import { bloqueDePlantillas, type PlantillasDeParada } from './bloque-de-plantillas'
import { alcance, COMPLETO } from './cabecera-de-alcance'
import { bloqueDeMemoria } from './memoria-de-la-parada'
import { REPORT_CONTRACT } from './report-contract'
import { SCAN_RULES, SECURITY_CHECKLIST } from './scan-checklist'

/**
 * Peticion completa que recibe el agente al escanear un proyecto o una parada.
 *
 * `temas` ausente = el prompt de siempre, como `rutas`: un parametro opcional
 * cuya ausencia deja el prompt donde estaba, para que un proyecto sin modulos
 * aplicables —o sin plantillas sembradas— componga exactamente lo de ayer.
 * `registradas` igual (ADR-101): las vivas que FORTRESS ya tiene en este
 * alcance, para que el tipo no se elija desde cero cada corrida.
 */
export function buildScanPrompt(
  projectName: string,
  corpus: CorpusDescriptor,
  rutas?: readonly string[],
  temas?: PlantillasDeParada,
  registradas: readonly string[] = []
): string {
  const docs = buildDocsFirst('security', corpus)
  const cabecera =
    rutas === undefined || rutas.length === 0 ? COMPLETO(projectName) : alcance(projectName, rutas)
  // Entre la checklist y las reglas: la de siempre manda y va primero (el ADR
  // fija que las plantillas refuerzan), y las reglas cierran sobre las dos.
  const bloque = temas === undefined ? '' : bloqueDePlantillas(temas, projectName)
  const memoria = bloqueDeMemoria(registradas)

  return [
    ...cabecera,
    '',
    GRAPH_FIRST_SECURITY,
    '',
    ...(docs === '' ? [] : [docs, '']),
    'Busca, en este orden:',
    SECURITY_CHECKLIST,
    '',
    ...(bloque === '' ? [] : [bloque, '']),
    ...(memoria === '' ? [] : [memoria, '']),
    'Reglas:',
    SCAN_RULES,
    '',
    REPORT_CONTRACT
  ].join('\n')
}
