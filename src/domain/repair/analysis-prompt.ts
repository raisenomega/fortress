import type { Candidate } from './select-target'

const KEYS = '"whatToChange", "where", "patternToCopy", "doNotTouch", "risk"'

/**
 * Peticion de ANALISIS (no de fix) para el analista grafo-primero. Pide un JSON
 * inerte con el entendimiento del hallazgo y del patron guardRun que habria que copiar.
 */
export function buildAnalysisPrompt(t: Candidate): string {
  return [
    `Eres el analista de FORTRESS. ANALIZA (no arregles) este hallazgo LOW:`,
    `"${t.title}" en ${t.file}:${t.line}.`,
    '',
    'GRAFO PRIMERO: usa get_architecture, search_graph, trace_path y get_code_snippet',
    'del servidor codebase-memory ANTES de leer archivos. Lee un archivo solo si el',
    'grafo no basta. El objetivo es entender BARATO.',
    '',
    'Entiende: (1) donde vive el handler postureRun, que lo llama y que toca;',
    '(2) como se USA guardRun en scan-handlers.ts y quality-handlers.ts (mismo patron):',
    'como se invoca, que parametros toma, que devuelve y que garantiza.',
    '',
    'NO propongas el fix ni escribas codigo. Responde SOLO con un objeto JSON con las',
    `claves ${KEYS} (valores en espanol, prosa inerte, sin bloques de codigo).`
  ].join('\n')
}
