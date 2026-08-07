/** Los 7 documentos que el agente redacta, EN ORDEN de propuesta y aprobacion. */
export const DRAFTED_DOCS = [
  'CONSTITUTION.md',
  'DDD-RULES.md',
  'SECURITY-BASELINE.md',
  'ARCHITECTURE.md',
  'CLAUDE.md',
  'AGENTS.md',
  'PROJECT-STATE.md'
] as const

export type DraftedDoc = (typeof DRAFTED_DOCS)[number]

/**
 * Los UNICOS que se commitean. TODA la documentacion de gobierno (CLAUDE,
 * DDD-RULES, AGENTS, PROJECT-STATE, ARCHITECTURE, CONSTITUTION, COGNITION-LOG,
 * SECURITY-BASELINE) es secreto interno estrategico —habla de estrategia, modelo
 * de negocio, estructura y tecnologia— y NUNCA sube al repo (regla inmutable): va
 * en el .gitignore de plantilla. Solo .gitignore y .env.example son publicos.
 */
export const COMMITTED_DOCS: readonly string[] = ['.gitignore', '.env.example']

/** Marcadores del envelope: el agente envuelve cada borrador entre ellos. */
export const DOC_OPEN = '<<<FORTRESS-DOC:'
export const DOC_CLOSE = 'FORTRESS-DOC-END>>>'

// El cierre debe ir en su propia linea (anclado): asi un documento que MENCIONE
// el marcador en prosa (p. ej. CLAUDE.md describiendo este formato) no trunca.
const BLOCK = /<<<FORTRESS-DOC:(.+?)\r?\n([\s\S]*?)\r?\n[ \t]*FORTRESS-DOC-END>>>[ \t]*(?=\r?\n|$)/g

/** Normaliza el nombre capturado al doc canonico (case-insensitive): una
 *  desviacion del LLM ('constitution.md') no debe bloquear al operador. */
function canonicalName(raw: string): string {
  const lower = raw.trim().toLowerCase()
  return DRAFTED_DOCS.find((doc) => doc.toLowerCase() === lower) ?? raw.trim()
}

/**
 * Captura los borradores que el agente envolvio en el marcador. Determinista:
 * la app escribe EXACTAMENTE esto en disco, el agente nunca lo toca. Devuelve
 * el ultimo contenido por nombre de archivo (una re-propuesta pisa la anterior).
 */
export function parseDocBlocks(text: string): Map<string, string> {
  const out = new Map<string, string>()
  for (const match of text.matchAll(BLOCK)) out.set(canonicalName(match[1]), match[2])
  return out
}
