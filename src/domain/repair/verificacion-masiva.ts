/**
 * Como termino el barrido de mitigados (ADR-087, Fase 3). Vocabulario CERRADO,
 * como `MotivoCierre` del escaneo y `FinDelDrenaje` del motor.
 *
 * `detenido` NO es un fallo: es el operador apretando Detener, con su cobertura
 * a medias pero sana. `ocupado` tampoco: es un freno del sistema —tope diario,
 * otra corrida, proyecto en revision— haciendo su trabajo. Solo `averia` es una
 * maquina rota. Juntarlos haria invisible cuantas veces revienta algo de verdad.
 *
 * NO hay `tope-vueltas` ni `tope-gasto`, y esa ausencia es la decision: este
 * gesto sigue la doctrina del ESCANEO —se compromete con los N mitigados y solo
 * el operador lo corta— y no la del drenaje, que lleva frenos duros porque puede
 * correr de madrugada sin nadie delante. Con 26 mitigados y un `loop_max_cycles`
 * de 25, reusar aquellos habria contestado «casi todos» a quien pidio «todos».
 */
export const FINES_DE_VERIFICACION = ['completado', 'detenido', 'ocupado', 'averia'] as const

export type FinDeVerificacion = (typeof FINES_DE_VERIFICACION)[number]

/**
 * En que quedo cada mitigado atendido. Una casilla por desenlace, y `sin_prueba`
 * y `sigue_vivo` NO se colapsan: el primero es «puede que lo arreglaras, pero no
 * se puede comprobar» y el segundo «el problema esta ahi». Fundirlos en un «no
 * se extinguio» le quitaria al operador justo el dato que le dice si su fix
 * sirvio (ver `dictamen-de-verificacion`).
 */
export interface RepartoDeVerificacion {
  /** Murieron con juicio: se van a la Historia. */
  readonly extinguidos: number
  /** Dijo obsoleto y no pudo probarlo. Sigue MITIGADO, con la razon escrita. */
  readonly sinPrueba: number
  /** El problema sigue: se les retira la marca y vuelven a la cola del motor. */
  readonly siguenVivos: number
  /** No estaba mitigado: verificar no le aplica y no se gasto nada en el. */
  readonly noMitigados: number
  /** Mitigado, pero una propuesta viva ya lo tiene cogido. */
  readonly yaTrabajados: number
  /** Desenlace fuera del vocabulario. Se anuncia a proposito: uno que no
   *  sabemos nombrar tiene que verse, no diluirse en la casilla de al lado. */
  readonly sinClasificar: number
}

export const NADA_VERIFICADO: RepartoDeVerificacion = {
  extinguidos: 0,
  sinPrueba: 0,
  siguenVivos: 0,
  noMitigados: 0,
  yaTrabajados: 0,
  sinClasificar: 0
}

/** El parte del barrido: que HIZO, no solo como acabo. `total` es la lista fija
 *  del arranque, y de ahi sale la X de «X de N» que declara la cobertura. */
export interface ResultadoVerificacionMasiva extends RepartoDeVerificacion {
  readonly fin: FinDeVerificacion
  readonly total: number
  readonly detalle?: string
}

/**
 * Cuantos se llegaron a verificar: DERIVADO del reparto, no guardado aparte.
 * Un contador propio al lado de las casillas es un segundo sitio donde la cuenta
 * puede quedarse vieja, y entonces la cobertura declarada dejaria de ser verdad.
 *
 * Los omitidos —de los dos tipos— no cuentan: a esos no los miro ningun
 * analista, y sumarlos diria que se verificaron.
 */
export function verificadosDe(reparto: RepartoDeVerificacion): number {
  return reparto.extinguidos + reparto.sinPrueba + reparto.siguenVivos + reparto.sinClasificar
}
