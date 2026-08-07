/** Resultado de "Verificar grafo": si conecta y que tools de lectura expone. */
export interface GraphVerify {
  readonly connected: boolean
  /** Nombres cortos de las tools del grafo visibles (get_architecture, ...). */
  readonly tools: readonly string[]
}

/** Un lado del A/B: coste real de una corrida. */
export interface AbSide {
  readonly tokens: number
  readonly costUsd: number
  /** Si la corrida termino con respuesta (no fallo). */
  readonly answered: boolean
}

/**
 * A/B reproducible del mismo prompt: 'lectura' (SOLO grafo, mapa barato) contra
 * 'normal' (plan: grafo + Bash/Read, analisis profundo y caro). No son
 * intercambiables — el grafo abarata el MAPA, leer archivos da la PROFUNDIDAD.
 */
export interface GraphAb {
  readonly question: string
  readonly lectura: AbSide
  readonly normal: AbSide
}

/** Las 3 tools cuya presencia confirma que el grafo llega de verdad a claude -p. */
export const GRAPH_CORE_TOOLS = ['get_architecture', 'search_graph', 'trace_path'] as const
