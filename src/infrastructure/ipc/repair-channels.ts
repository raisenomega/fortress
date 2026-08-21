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
  /** Cuantos hallazgos vivos no puede elegir la cola por si sola. */
  repairCerco: 'repair:cerco',
  /** Empuje al renderer: el expediente de ese proyecto cambio. Solo el id. */
  repairChanged: 'repair:changed'
} as const
