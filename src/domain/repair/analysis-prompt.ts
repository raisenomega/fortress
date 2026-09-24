import { bloqueDeCapacidades, type Capacidades } from '../agent/capacidades-del-agente'
import type { CognitionPattern } from '../cognition/cognition-log'
import { seccionAtendido } from './analysis-prompt-atendido'
import { patronDelHallazgo } from './patron-del-hallazgo'
import { ALCANCE_DEL_SITIO } from './analysis-prompt-alcance'
import { CALLEJONES } from './analysis-prompt-callejones'
import { EL_GRAFO } from './analysis-prompt-grafo'
import { senasDelHallazgo } from './analysis-prompt-senas'
import { FORMATO } from './analysis-prompt-formato'
import { sanearParaPrompt } from '../shared/sanear-para-prompt'
import type { CorpusDescriptor } from '../project/corpus-descriptor'
import { buildDocsFirst } from '../settings/docs-first-compose'
import type { Candidate } from './select-target'

/**
 * Peticion de ANALISIS (no de fix) para el analista grafo-primero. Generica: sirve
 * para cualquier hallazgo. Pide VERIFICAR contra el archivo real si sigue siendo REAL
 * u OBSOLETO (como paso con posture), y un JSON inerte con el entendimiento.
 */
// prettier-ignore
export function buildAnalysisPrompt(t: Candidate, corpus: CorpusDescriptor, atendidas: readonly string[], enElGrafo: string, capacidades: Capacidades, patrones: readonly CognitionPattern[] = []): string {
  // El analista juzga si un hallazgo de seguridad sigue vivo: lo que el proyecto
  // haya escrito sobre lo que protege es parte de esa respuesta.
  const docs = buildDocsFirst('security', corpus)
  return [
    `Eres el analista de FORTRESS. ANALIZA (no arregles) este hallazgo ${t.severity}:`,
    `"${sanearParaPrompt(t.title)}" en ${sanearParaPrompt(t.file)}:${t.line}. Detectado el ${t.firstSeen.slice(0, 10)}.`,
    '',
    // La antiguedad es contexto para el veredicto: un hallazgo de hace semanas
    // ha tenido tiempo de arreglarse por otra via, y uno de hoy no. No decide
    // nada por si sola —la prueba sigue siendo el fichero—, pero orienta donde
    // mirar. El sha del arbol NO se le da: la prueba es el fichero de hoy, no
    // un diff, y un dato que no va a usar solo ocupa prompt.
    'La fecha NO es prueba: lo que decide es el fichero. Orienta, nada mas.',
    ...senasDelHallazgo(t),
    ...patronDelHallazgo(t, patrones),
    ...(t.intentos == null ? [] : ['', t.intentos]),
    ...(t.hermanos == null ? [] : ['', t.hermanos]),
    ...(t.barreras === undefined || t.barreras.length === 0 ? [] : ['', ...t.barreras]),
    '',
    ...(docs === '' ? [] : [docs, '']),
    `En el grafo este proyecto se llama "${enElGrafo}" (deducido de su ruta; si no`,
    'cuadra, search_graph responde con los nombres reales). Usalo como project en cada consulta.',
    '',
    ...EL_GRAFO,
    // Lo que PUEDE, leido de los args con que se lanza: nunca texto fijo.
    ...bloqueDeCapacidades(capacidades),
    ...CALLEJONES,
    'Pasos: (1) localiza en el grafo el simbolo del hallazgo, quien lo llama y que toca;',
    '(2) si el fix seria agregar un control ya usado en el repo (el titulo suele',
    'nombrarlo), encuentra COMO se usa ese control en otros lugares: como se invoca y',
    'que garantiza; (3) CRUCIAL: VERIFICA contra el archivo REAL, linea por linea, si',
    'el hallazgo SIGUE siendo REAL o ya esta RESUELTO (OBSOLETO). No te creas el',
    'hallazgo: leelo. Abrir el fichero del ancla NO contradice el grafo primero: el',
    'grafo decide QUE abrir, no si abrir.',
    '',
    ...ALCANCE_DEL_SITIO,
    'NO propongas el fix ni escribas codigo.',
    ...FORMATO,
    ...seccionAtendido(atendidas)
  ].join('\n')
}
