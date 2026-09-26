import type { Result } from '../shared/result'
import { ENVIO_SIN_DATO, type DesenlaceDelEnvio } from './desenlace-del-envio'
import { esEnvioNegado, type EnvioNegado } from './envio-negado'
import type { VeredictoDelPlan } from './juicio-del-plan'
import type { SinCierre } from './motivo-sin-cierre'

/** Lo minimo de la salida de `chat:send` que la cola mira. Estructural: el tipo
 *  entero vive en `application`, y el dominio no importa de ahi. */
interface SalidaDelEnvio {
  readonly sinCierre: SinCierre | null
  readonly sinVerificar: boolean
  /** Solo viene en el turno de plan de un lote en autonomo; ausente = nadie lo juzgo. */
  readonly plan?: VeredictoDelPlan | null
}

/**
 * Lo que la cola del lote lee de un envio, segun COMO volvio. Tres caminos:
 *
 *   corrio    su cierre, tal cual lo dijo el main
 *   NEGADO    una puerta lo paro antes de empezar: que puerta y con que palabras
 *   revento   nada que leer — y NO es una negativa: el turno existio
 *
 * Vivia dentro de `sendMessage`, que solo conocia el primero. Pura y aparte para
 * que el tercer camino no se confunda con el segundo sin que un test lo vea.
 */
export function desenlaceDelResultado(
  resultado: Result<SalidaDelEnvio> | EnvioNegado
): DesenlaceDelEnvio {
  if (esEnvioNegado(resultado)) {
    return { ...ENVIO_SIN_DATO, negado: { puerta: resultado.puerta, motivo: resultado.error } }
  }
  if (!resultado.ok) return ENVIO_SIN_DATO
  const { sinCierre, sinVerificar, plan } = resultado.value
  return { sinCierre, sinVerificar, plan: plan ?? null, negado: null }
}
