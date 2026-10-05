import type { AnalystRunMeta } from '@domain/repair/analysis'
import { trabajoReal } from '@domain/repair/budget'
import type { TokenUsage } from '@domain/telemetry/token-usage'
import type { JuicioDelModelo } from '@domain/agent/guardia-del-modelo'

export interface RelojDeCorrida {
  /** La corrida ocurrio y NO dejo factura legible: solo viaja el reloj. */
  readonly sinFactura: () => AnalystRunMeta
  /** Con factura si la hay; sin ella cae en `sinFactura`, nunca en ceros. */
  readonly meta: (usage?: TokenUsage, juicio?: JuicioDelModelo) => AnalystRunMeta
}

/**
 * El cronometro de una corrida de agente, compartido por los tres que existen.
 *
 * Los tres lo tenian calcado —el generador y el revisor palabra por palabra, el
 * analista escrito a mano dentro de su `return`— y tres copias de la misma
 * decision envejecen por separado: la de cp120, que un cero de tokens no es lo
 * mismo que no haber podido medir, habria que recordarla en tres sitios.
 *
 * `sinFactura` omite la clave `usage` en vez de mandar una de ceros. Es la
 * senal que `record-motor-run` lee para asentar la fila diciendo que no hubo
 * factura, en lugar de afirmar que la corrida salio gratis.
 */
export function relojDeCorrida(startedAt: number): RelojDeCorrida {
  const sinFactura = (): AnalystRunMeta => ({
    durationMs: Date.now() - startedAt,
    startedAt,
    endedAt: Date.now()
  })
  const conFactura = (usage?: TokenUsage): AnalystRunMeta =>
    usage === undefined
      ? sinFactura()
      : {
          tokensUsed: trabajoReal(usage) > 0 ? trabajoReal(usage) : undefined,
          usage,
          durationMs: Date.now() - startedAt,
          startedAt,
          endedAt: Date.now()
        }
  // El juicio del modelo (ADR-078, enmienda) viaja en la factura: el modelo que
  // DE VERDAD corrio llega asi al embudo que asienta la corrida.
  const conJuicio = (j?: JuicioDelModelo): Partial<AnalystRunMeta> =>
    j === undefined ? {} : { juicioModelo: j, ...(j.modelo === null ? {} : { model: j.modelo }) }

  return { sinFactura, meta: (usage, juicio) => ({ ...conFactura(usage), ...conJuicio(juicio) }) }
}
