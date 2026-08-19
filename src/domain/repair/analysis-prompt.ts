import type { CorpusDescriptor } from '../project/corpus-descriptor'
import { buildDocsFirst } from '../settings/docs-first-compose'
import type { Candidate } from './select-target'

const KEYS = '"status", "whatToChange", "where", "patternToCopy", "doNotTouch", "risk"'

/**
 * La clave opcional va DENTRO del mismo objeto, no en un bloque aparte: la
 * respuesta sigue siendo un solo JSON, que es lo que el prompt exige y lo que
 * el parser sabe leer.
 */
const NOTES = [
  '',
  'Clave OPCIONAL "notes": si FORTRESS (la herramienta que te ejecuta, NO el proyecto',
  'que analizas) te limito o te falto algo —un bug, un gap, una restriccion de entorno,',
  'permisos o plan-mode que te impidio trabajar, o la OPORTUNIDAD de una capacidad que',
  'te habria ayudado— anadela con la forma',
  '[{"kind":"limitacion|bug|gap|falta|oportunidad","area":"zona","note":"que paso o que crear"}].',
  'No es un hallazgo del proyecto; es para que FORTRESS madure. Si no hubo nada, omitela.'
]

/**
 * Peticion de ANALISIS (no de fix) para el analista grafo-primero. Generica: sirve
 * para cualquier hallazgo. Pide VERIFICAR contra el archivo real si sigue siendo REAL
 * u OBSOLETO (como paso con posture), y un JSON inerte con el entendimiento.
 */
export function buildAnalysisPrompt(t: Candidate, corpus: CorpusDescriptor): string {
  // El analista juzga si un hallazgo de seguridad sigue vivo: lo que el proyecto
  // haya escrito sobre lo que protege es parte de esa respuesta.
  const docs = buildDocsFirst('security', corpus)
  return [
    `Eres el analista de FORTRESS. ANALIZA (no arregles) este hallazgo ${t.severity}:`,
    `"${t.title}" en ${t.file}:${t.line}.`,
    '',
    ...(docs === '' ? [] : [docs, '']),
    'GRAFO PRIMERO: usa get_architecture, search_graph, trace_path y get_code_snippet',
    'del servidor codebase-memory ANTES de leer archivos. Lee un archivo solo si el',
    'grafo no basta. Entender BARATO.',
    '',
    'Pasos: (1) localiza en el grafo el simbolo del hallazgo, quien lo llama y que toca;',
    '(2) si el fix seria agregar un control ya usado en el repo (el titulo suele',
    'nombrarlo), encuentra COMO se usa ese control en otros lugares: como se invoca y',
    'que garantiza; (3) CRUCIAL: VERIFICA contra el archivo REAL, linea por linea, si',
    'el hallazgo SIGUE siendo REAL o ya esta RESUELTO (OBSOLETO). No te creas el',
    'hallazgo: leelo.',
    '',
    'NO propongas el fix ni escribas codigo. Responde SOLO con un objeto JSON con las',
    `claves ${KEYS}. "status" es "REAL" u "OBSOLETO"; el resto, prosa inerte en espanol.`,
    ...NOTES
  ].join('\n')
}
