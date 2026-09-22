import type { TipoDeDefecto } from '../scan/tipo-de-defecto'

export interface ZombiAJuzgar {
  readonly id: string
  readonly file: string
  readonly line: number | null
  readonly title: string
  readonly severity: string
  readonly identity: string
}

/** Lo que devuelve el agente por hallazgo, sin fiarse de nada. */
export interface RespuestaDelJuicio {
  readonly id: string
  readonly status?: unknown
  readonly tipo?: unknown
  readonly simbolo?: unknown
  readonly evidencia?: { readonly marcador?: unknown; readonly forma?: unknown }
  readonly razon?: unknown
}

interface Reidentificada {
  readonly tipo: TipoDeDefecto
  readonly simbolo: string
  readonly identidad_nueva: string
  readonly nota: string | null
}

export type Veredicto =
  | ({
      readonly id: string
      readonly desenlace: 'extinguida'
      readonly motivo: string
    } & Reidentificada)
  | ({ readonly id: string; readonly desenlace: 'sin_prueba' } & Reidentificada)
  | ({ readonly id: string; readonly desenlace: 'real'; readonly razon: string } & Reidentificada)
  | { readonly id: string; readonly desenlace: 'sin_decidir'; readonly motivo: string }
