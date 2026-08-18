import type { OmegaVerdict } from '@domain/repair/omega-verdict'
import { EMPTY_USAGE } from '@domain/telemetry/token-usage'

/** El material del juicio: veredicto limpio, factura y analisis previo. */
export const APROBADO: OmegaVerdict = {
  resuelve_el_hallazgo: 'SI', respeta_scope: 'SI', respeta_doNotTouch: 'SI',
  calidad_del_diff: 'BUENO', riesgo_residual: 'NINGUNO',
  veredicto_global: 'APROBADO', razon: 'fix minimo y correcto'
} // prettier-ignore

/** Con factura, como la corrida real: sin ella no entra en el libro mayor. */
export const META = { tokensUsed: 120_000, durationMs: 60_000, startedAt: 1, endedAt: 2, usage: EMPTY_USAGE } // prettier-ignore
export const ANALYSIS = {
  target: { id: 'f1', severity: 'LOW', title: 't', file: 'src/a/b.ts', line: 1 },
  status: 'REAL', whatToChange: 'w', where: 'src/a/b.ts',
  patternToCopy: 'p', doNotTouch: 'n', risk: 'bajo', tokensUsed: 1
} // prettier-ignore
