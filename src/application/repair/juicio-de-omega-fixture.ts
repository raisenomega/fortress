import { EMPTY_CORPUS } from '@domain/project/corpus-descriptor'
import type { HallazgoJuzgado } from '@domain/repair/hallazgo-juzgado'
import type { OmegaVerdict } from '@domain/repair/omega-verdict'
import type { DepsDelJuicio } from './juicio-de-omega'
import type { OmegaAgentResult } from './run-omega'

/** El Terminal NO tiene `Analysis`: construye esto desde el hallazgo y el plan. */
export const PLAN: HallazgoJuzgado = {
  target: { title: 'falta Content-Security-Policy', file: 'src/index.html', line: 3 },
  whatToChange: 'anadir la CSP',
  where: 'la cabecera',
  patternToCopy: 'la meta de scan-handlers',
  doNotTouch: 'el resto del head',
  risk: 'bajo'
}

export const META = { durationMs: 1, startedAt: 0, endedAt: 1 }

/** Los seis ejes en verde: cada test empeora solo el que quiere probar. */
export const EJES = {
  resuelve_el_hallazgo: 'SI',
  respeta_scope: 'SI',
  respeta_doNotTouch: 'SI',
  calidad_del_diff: 'BUENO',
  riesgo_residual: 'NINGUNO'
} as const

export const ENTRADA = { arbol: '/w', baseSha: 'base', analysis: PLAN, corpus: EMPTY_CORPUS }

/** Guarda el prompt que se le paso a OMEGA: es como se comprueba que el plano
 *  llego entero sin tener que mirar dentro de `buildOmegaPrompt`. */
export function deps(crudo: OmegaAgentResult): DepsDelJuicio & { prompt: () => string } {
  let visto = ''
  return {
    changedFiles: () => Promise.resolve(['src/index.html']),
    diffText: () => Promise.resolve('+ <meta ...>'),
    readPost: () => 'despues',
    readPre: () => Promise.resolve('antes'),
    omega: { run: (_arbol, prompt) => ((visto = prompt), Promise.resolve(crudo)) },
    prompt: () => visto
  }
}

export const conVeredicto = (v: OmegaVerdict): OmegaAgentResult => ({
  ok: true,
  verdict: v,
  runMeta: META,
  notas: []
})
