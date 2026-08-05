/**
 * Prompt para que un AGENTE redacte la definicion de un agente auto-propuesto y
 * la devuelva en un bloque parseable. Solo texto: no edita ni ejecuta nada.
 */
export function buildDraftPrompt(name: string, originNote: string): string {
  return [
    `Redacta la definicion de un subagente de FORTRESS llamado "${name}".`,
    originNote ? `Contexto (de donde nacio la idea): ${originNote}` : '',
    'Escribe en espanol un prompt claro y seguro para ese subagente, que respete',
    'las reglas de FORTRESS (evidencia siempre; no tocar auth/pagos/seguridad sin',
    'avisar; fixes pequenos). No ejecutes nada: solo devuelve el borrador.',
    'Al final, y nada mas despues, un bloque exactamente asi:',
    'AGENT-DRAFT: {"name":"nombre corto","prompt":"el prompt del subagente"}'
  ]
    .filter((line) => line.length > 0)
    .join('\n')
}

export interface ParsedDraft {
  readonly name: string
  readonly prompt: string
}

/** Extrae el bloque AGENT-DRAFT del texto del agente. Tolerante: null si falla. */
export function parseAgentDraft(text: string): ParsedDraft | null {
  const match = text.match(/AGENT-DRAFT:\s*(\{[\s\S]*\})/)
  if (!match) return null
  try {
    const raw = JSON.parse(match[1]) as Record<string, unknown>
    if (typeof raw.name !== 'string' || typeof raw.prompt !== 'string') return null
    if (raw.name.trim().length === 0 || raw.prompt.trim().length === 0) return null
    return { name: raw.name.trim().slice(0, 80), prompt: raw.prompt.trim().slice(0, 4000) }
  } catch {
    return null
  }
}
