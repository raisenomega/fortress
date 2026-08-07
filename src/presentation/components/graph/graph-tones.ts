import type { ActionTone } from '@domain/graph/graph-action-status'

/** Color por estado, comun a las 3 acciones del grafo: gris/naranja/verde/rojo. */
export const TONE_CLASS: Record<ActionTone, string> = {
  idle: 'text-muted-foreground',
  running: 'text-high animate-pulse',
  warn: 'text-high',
  ok: 'text-success',
  error: 'text-critical'
}
