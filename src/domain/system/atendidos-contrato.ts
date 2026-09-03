import type { ObservationStatus } from './self-observation'

/** Los dos unicos estados que un registro externo puede imponer. */
const CIERRES = ['atendido', 'descartado'] as const

export type CierreDeObservacion = (typeof CIERRES)[number]

/** Una entrada del registro, ya validada. */
export interface EntradaAtendida {
  readonly id: string
  readonly status: CierreDeObservacion
  readonly reason: string | null
  readonly attendedBy: string
  readonly attendedAt: string
  /** El commit que la arregla. Texto plano: NO se contrasta con git, porque el
   *  registro no puede depender de que ese commit siga existiendo manana. */
  readonly fixSha: string | null
}

/** Por que se rechazo una entrada. Cerrado: un motivo libre acaba siendo "otro". */
export const MOTIVOS_DE_RECHAZO = {
  NO_ES_OBJETO: 'la entrada no es un objeto',
  SIN_ID: 'sin id, o el id no es texto',
  ESTADO_INVALIDO: 'status debe ser atendido o descartado',
  DESCARTE_SIN_MOTIVO: 'descartado exige reason: un descarte sin motivo es un cajon',
  SIN_AUTOR: 'sin attendedBy',
  SIN_FECHA: 'sin attendedAt',
  ID_DUPLICADO: 'el id aparece mas de una vez en el fichero',
  NO_ENCONTRADA: 'no hay ninguna observacion con ese id'
} as const

export interface Rechazada {
  readonly id: string | null
  readonly motivo: string
}

const texto = (v: unknown): v is string => typeof v === 'string' && v.trim().length > 0
const esCierre = (v: unknown): v is CierreDeObservacion =>
  (CIERRES as readonly unknown[]).includes(v)

/** Una entrada suelta: o sale validada, o sale con su motivo. Nunca lanza. */
function validar(item: unknown): EntradaAtendida | Rechazada {
  if (typeof item !== 'object' || item === null) {
    return { id: null, motivo: MOTIVOS_DE_RECHAZO.NO_ES_OBJETO }
  }
  const o = item as Record<string, unknown>
  const id = texto(o.id) ? o.id : null
  if (id === null) return { id: null, motivo: MOTIVOS_DE_RECHAZO.SIN_ID }
  if (!esCierre(o.status)) return { id, motivo: MOTIVOS_DE_RECHAZO.ESTADO_INVALIDO }
  const reason = texto(o.reason) ? o.reason : null
  if (o.status === 'descartado' && reason === null) {
    return { id, motivo: MOTIVOS_DE_RECHAZO.DESCARTE_SIN_MOTIVO }
  }
  if (!texto(o.attendedBy)) return { id, motivo: MOTIVOS_DE_RECHAZO.SIN_AUTOR }
  if (!texto(o.attendedAt)) return { id, motivo: MOTIVOS_DE_RECHAZO.SIN_FECHA }

  const status: ObservationStatus = o.status
  return { id, status, reason, attendedBy: o.attendedBy, attendedAt: o.attendedAt, fixSha: texto(o.fixSha) ? o.fixSha : null } // prettier-ignore
}

export const esRechazada = (v: EntradaAtendida | Rechazada): v is Rechazada => 'motivo' in v

export { validar as validarEntrada }
