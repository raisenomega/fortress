import type { CorpusDescriptor } from '../project/corpus-descriptor'
import { buildDocsFirst } from '../settings/docs-first-compose'
import type { Candidate } from './select-target'

const NOTA = '{"kind":"limitacion|bug|gap|falta|oportunidad","area":"zona","note":"que paso"}'

/**
 * El contrato de formato, DICHO AL MODELO y no solo sabido por el codigo.
 *
 * Esta regla vivia unicamente en un comentario, y el prompt hacia lo contrario
 * de lo que el comentario pedia: anunciaba "notes" en un parrafo aparte, tras
 * una linea en blanco, con un array suelto por ejemplo. El analista lo leyo como
 * una seccion independiente —lectura razonable— y respondio en dos bloques. El
 * parser barre del primer `{` al ultimo `}`, se trago los dos, y un analisis
 * correcto y entero se perdio por la forma.
 *
 * Por eso el prompt explica ademas POR QUE: una restriccion con motivo se
 * respeta mejor que una arbitraria, y aqui el motivo cabe en una linea.
 */
const FORMATO = [
  '',
  'FORMATO — responde con UN UNICO objeto JSON y NADA mas: ni un segundo bloque,',
  'ni texto fuera del objeto. Tu respuesta se lee barriendo del primer { al ultimo },',
  'asi que cualquier otro JSON en el mensaje se mezcla con este y se pierde el',
  'analisis entero.',
  '',
  'Claves: "status" ("REAL" u "OBSOLETO"), y "whatToChange", "where", "patternToCopy",',
  '"doNotTouch", "risk" en prosa inerte en espanol.',
  '',
  'Clave OPCIONAL "notes": si FORTRESS (la herramienta que te ejecuta, NO el proyecto',
  'que analizas) te limito o te falto algo —un bug, un gap, una restriccion de entorno,',
  'permisos o plan-mode que te impidio trabajar, o la OPORTUNIDAD de una capacidad que',
  'te habria ayudado—, anotalo ahi. No es un hallazgo del proyecto; es para que FORTRESS',
  'madure. Si no hubo nada, omite la clave.',
  '',
  '"notes" va DENTRO del objeto, como una clave mas. NUNCA en un bloque aparte:',
  '{"status":"REAL","whatToChange":"...","where":"...","patternToCopy":"...",',
  ` "doNotTouch":"...","risk":"...","notes":[${NOTA}]}`
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
    'NO propongas el fix ni escribas codigo.',
    ...FORMATO
  ].join('\n')
}
