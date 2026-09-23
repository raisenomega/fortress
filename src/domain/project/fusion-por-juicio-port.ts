import type { Fusion } from './fusion-de-duplicados'

/** Escribir la fusion que decidio un agente (ADR-101 §3). Devuelve cuantas absorbio. */
export interface FusionPorJuicioPort {
  fundirPorJuicio(projectId: string, fusion: Fusion): number
}
