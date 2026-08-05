import type { EpisodeOutcome } from './capability-episode'

/**
 * Prompt para que la capacidad se plantee UN escenario, lo resuelva razonando y
 * se auto-evalue. Solo texto en un sandbox: no ejecuta nada real.
 */
export function buildEpisodePrompt(name: string, definition: string): string {
  return [
    `Eres la capacidad "${name}" de FORTRESS, aprendiendo.`,
    definition ? `Tu definicion: ${definition}` : '',
    'Plantea UN escenario plausible dentro de tu proposito, resuelvelo razonando,',
    'y auto-evalua con honestidad si tu decision fue buena o mala.',
    'Al final, y nada mas despues, un bloque exactamente asi:',
    'EPISODE: {"outcome":"ok|fail","summary":"que escenario y como te fue, breve"}'
  ]
    .filter((line) => line.length > 0)
    .join('\n')
}

export interface ParsedEpisode {
  readonly outcome: EpisodeOutcome
  readonly summary: string
}

/** Extrae el bloque EPISODE del texto. Tolerante: null si falta o esta roto. */
export function parseEpisode(text: string): ParsedEpisode | null {
  const match = text.match(/EPISODE:\s*(\{[\s\S]*\})/)
  if (!match) return null
  try {
    const raw = JSON.parse(match[1]) as Record<string, unknown>
    const outcome = raw.outcome === 'fail' ? 'fail' : raw.outcome === 'ok' ? 'ok' : null
    if (outcome === null || typeof raw.summary !== 'string' || raw.summary.trim().length === 0) {
      return null
    }
    return { outcome, summary: raw.summary.trim().slice(0, 300) }
  } catch {
    return null
  }
}
