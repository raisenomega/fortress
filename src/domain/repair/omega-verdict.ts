export type OmegaAxis = 'SI' | 'NO' | 'PARCIAL'
export type YesNo = 'SI' | 'NO'
export type Quality = 'BUENO' | 'ACEPTABLE' | 'RUIDOSO'
export type Risk = 'NINGUNO' | 'MENOR' | 'MAYOR'
export type GlobalVerdict = 'APROBADO' | 'VETADO'

/** El juicio semantico de OMEGA sobre un fix: 6 ejes + veredicto + razon. */
export interface OmegaVerdict {
  readonly resuelve_el_hallazgo: OmegaAxis
  readonly respeta_scope: YesNo
  readonly respeta_doNotTouch: YesNo
  readonly calidad_del_diff: Quality
  readonly riesgo_residual: Risk
  readonly veredicto_global: GlobalVerdict
  /** 1-3 lineas del revisor. */
  readonly razon: string
}

export type OmegaAxes = Omit<OmegaVerdict, 'veredicto_global' | 'razon'>

/**
 * D19 — el veredicto sintetico lo computa el MOTOR, no el agente: los ejes son
 * evidencia; la regla es codigo. VETADO solo por los cuatro caminos duros.
 * PARCIAL, RUIDOSO y MENOR degradan la calidad pero NO vetan: eso lo juzga el
 * humano en I5 con la tabla delante.
 */
export function computeGlobalVerdict(axes: OmegaAxes): GlobalVerdict {
  if (axes.resuelve_el_hallazgo === 'NO') return 'VETADO'
  if (axes.respeta_scope === 'NO') return 'VETADO'
  if (axes.respeta_doNotTouch === 'NO') return 'VETADO'
  if (axes.riesgo_residual === 'MAYOR') return 'VETADO'
  return 'APROBADO'
}
