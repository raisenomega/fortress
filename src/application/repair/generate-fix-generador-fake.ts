import { EMPTY_USAGE } from '@domain/telemetry/token-usage'
import type { GenerateDeps } from './generate-types'
import { SIN_FACTURA, type Opciones } from './generate-fix-fixture-base'

/**
 * El generador doblado, con los cuatro desenlaces que el real produce.
 *
 * El del PLAZO llega sin factura a proposito: en el origen el SIGKILL cae antes
 * de que el CLI emita su unico JSON, asi que no hay gasto que leer. Un doble que
 * devolviera ceros probaria un mundo que no existe.
 */
export function generadorFake(
  opts: Opciones,
  calls: string[],
  prompts: string[]
): GenerateDeps['generator'] {
  return {
    generate: (_wt: string, prompt: string) => {
      calls.push('generate')
      prompts.push(prompt)
      const runMeta = { tokensUsed: opts.genCost ?? 50_000, durationMs: 9, startedAt: 1, endedAt: 10, usage: EMPTY_USAGE } // prettier-ignore
      if (opts.turnosAgotados === true) return Promise.resolve({ ok: false as const, error: 'no completo en 30 turnos', turnosAgotados: true as const, runMeta }) // prettier-ignore
      if (opts.timedOut === true) return Promise.resolve({ ok: false as const, error: 'timeout tras 15 min', timedOut: true as const, runMeta: SIN_FACTURA }) // prettier-ignore
      if (opts.generatorFails === true) return Promise.resolve({ ok: false as const, error: 'kaput', runMeta }) // prettier-ignore
      return Promise.resolve({ ok: true as const, runMeta })
    }
  }
}
