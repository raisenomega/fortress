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
 * Los que SI se commitean (marco publico del proyecto). El resto —CONSTITUTION,
 * COGNITION-LOG, SECURITY-BASELINE— es estrategia interna y va en .gitignore.
 */
export const COMMITTED_DOCS: readonly string[] = [
  'CLAUDE.md',
  'DDD-RULES.md',
  'AGENTS.md',
  'PROJECT-STATE.md',
  'ARCHITECTURE.md',
  '.gitignore',
  '.env.example'
]

/** Marcadores del envelope: el agente envuelve cada borrador entre ellos. */
export const DOC_OPEN = '<<<FORTRESS-DOC:'
export const DOC_CLOSE = 'FORTRESS-DOC-END>>>'

const BLOCK = /<<<FORTRESS-DOC:(.+?)\r?\n([\s\S]*?)\r?\nFORTRESS-DOC-END>>>/g

/**
 * Captura los borradores que el agente envolvio en el marcador. Determinista:
 * la app escribe EXACTAMENTE esto en disco, el agente nunca lo toca. Devuelve
 * el ultimo contenido por nombre de archivo (una re-propuesta pisa la anterior).
 */
export function parseDocBlocks(text: string): Map<string, string> {
  const out = new Map<string, string>()
  for (const match of text.matchAll(BLOCK)) out.set(match[1].trim(), match[2])
  return out
}
