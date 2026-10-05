import type { AnalystRunMeta } from '@domain/repair/analysis'

/** Lo que una corrida del generador deja. `sesion` es con que se reanuda la
 *  siguiente vuelta del lazo (ADR-110); ausente, no hay nada que reanudar. */
export type GeneratorResult =
  | { ok: true; runMeta: AnalystRunMeta; sesion?: string }
  /** `turnosAgotados` y `timedOut` viajan DESDE EL ADAPTADOR porque solo alli se
   *  sabe: quien lee la salida despues no puede distinguir su reloj del ajeno. */
  // prettier-ignore
  | { ok: false; error: string; turnosAgotados?: true; timedOut?: true; noArranco?: true; modeloFuera?: true; runMeta: AnalystRunMeta; sesion?: string }

export interface GraphGenerator {
  /** `reanudar`: la sesion de la vuelta anterior. Sin ella, sesion nueva. */
  generate(worktreePath: string, prompt: string, reanudar?: string): Promise<GeneratorResult>
}
