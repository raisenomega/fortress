import { juzgarModelo, type JuicioDelModelo } from '@domain/agent/guardia-del-modelo'
import type { Peldano } from '@domain/agent/escalera-de-modelos'
import type { TokenUsage } from '@domain/telemetry/token-usage'
import { processOmegaOut } from './omega-out'

export interface SalidaDelJuez {
  readonly usage?: TokenUsage
  readonly text: string
  readonly juicio: JuicioDelModelo
  /** Por que esta corrida NO es un juicio: el proveedor fallo, o corrio en un
   *  modelo que no es el suyo. Ausente = hay texto que leer. */
  readonly fallo?: { readonly error: 'provider_error' | 'modelo_no_asignado'; readonly detalle: string }
}

/**
 * La salida de un JUEZ del Motor (OMEGA, critico), abierta y mirada antes de
 * leerla como juicio: primero el proveedor (el 429 del 05-oct no es un
 * veredicto mal escrito), despues el modelo que corrio contra el pedido
 * (ADR-078, enmienda). Compartida para que los dos jueces no envejezcan por
 * separado; el resto de su ciclo sigue sin compartir codigo, a proposito.
 */
export function salidaDelJuez(out: string, pedido: Peldano): SalidaDelJuez {
  const { usage, text, proveedor, modelos } = processOmegaOut(out)
  const juicio = juzgarModelo(pedido, modelos)
  if (proveedor !== undefined) return { usage, text, juicio, fallo: { error: 'provider_error', detalle: proveedor } } // prettier-ignore
  if (juicio.veredicto === 'falla') return { usage, text, juicio, fallo: { error: 'modelo_no_asignado', detalle: juicio.motivo ?? '' } } // prettier-ignore
  return { usage, text, juicio }
}
