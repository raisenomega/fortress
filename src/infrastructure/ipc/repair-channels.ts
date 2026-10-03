/** Canales del motor de reparacion disciplinado (C1->C2 en I1). */
export const REPAIR_CHANNELS = {
  repairPropose: 'repair:propose',
  repairList: 'repair:list',
  repairGet: 'repair:get',
  repairEvents: 'repair:events',
  repairGenerate: 'repair:generate',
  repairRunGate: 'repair:run-gate',
  repairRunOmega: 'repair:run-omega',
  repairRetry: 'repair:retry',
  /** La salida de una propuesta viva: el operador la caduca con motivo. */
  repairWithdraw: 'repair:withdraw',
  /** La firma humana: integrar una propuesta que OMEGA ya aprobo. */
  repairSign: 'repair:sign',
  /** Drenar los elegibles dejandolos juzgados y esperando firma. */
  repairDrain: 'repair:drain',
  repairDrainStop: 'repair:drain:stop',
  /** Cuantos hallazgos vivos no puede elegir la cola por si sola. */
  repairCerco: 'repair:cerco',
  /** La guia ESTATICA del orden de firma: barata, sin correr nada. */
  repairGuiaDeFirma: 'repair:guia-de-firma',
  /** La sonda del conjunto + biseccion si sale roja. Nada caduca: no hay firma. */
  repairMedirTanda: 'repair:medir-tanda',
  /** Empuje al renderer: el expediente de ese proyecto cambio. Solo el id. */
  repairChanged: 'repair:changed'
} as const
