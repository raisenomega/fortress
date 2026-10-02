/**
 * Un veredicto APROBADO y COMPLETO, que es lo que un `omega.ok` lleva SIEMPRE en
 * el libro real. El doble no lo llevaba, y con el lazo eso dejo de ser inocuo:
 * el eje `resuelve_el_hallazgo` es lo que decide si se da otra vuelta.
 */
export const COMPLETO = {
  resuelve_el_hallazgo: 'SI', respeta_scope: 'SI', respeta_doNotTouch: 'SI',
  calidad_del_diff: 'BUENO', riesgo_residual: 'NINGUNO', veredicto_global: 'APROBADO',
  razon: 'cierra el hallazgo'
} as const // prettier-ignore

/** Y el que resuelve a MEDIAS: el que dispara el lazo (ADR-110). */
export const PARCIAL = { ...COMPLETO, resuelve_el_hallazgo: 'PARCIAL', razon: 'falta la mitad' } as const // prettier-ignore
