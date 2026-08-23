/**
 * Por que muere un hallazgo. Se guarda con la extincion, no se deduce despues.
 *
 * Antes solo quedaban `lifecycle` y una fecha, asi que reconstruir por que se
 * cerro uno exigia cruzar la base con el historial de git archivo por archivo.
 * Es lo que hubo que hacer para descubrir que dos hallazgos de la CSP habian
 * muerto por un comentario, y esa auditoria no deberia depender de que a
 * alguien se le ocurra hacerla a mano.
 */
export const MOTIVOS_EXTINCION = [
  /** Un agente lo miro y dictamino que el problema ya no esta. La unica via hoy. */
  'juicio_obsoleto',
  /** Historico: el escaneo no lo nombro y su archivo habia cambiado. Ya no se
   *  escribe — es la extincion por ausencia que esta pieza elimina. */
  'ausencia_historica'
] as const

export type MotivoExtincion = (typeof MOTIVOS_EXTINCION)[number]
