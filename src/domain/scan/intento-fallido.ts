import type { SelfNoteDraft } from '../system/self-observation'
import type { TokenUsage } from '../telemetry/token-usage'

/** Por que no hubo informe. Los dos gastan; el segundo ademas TERMINO BIEN. */
export type MotivoDelFallo =
  /** El proceso murio: lo mato el reloj, un error, o se cayo. */
  | 'proceso'
  /**
   * Termino con exito y su salida no se entendio. Es el caso de Health Flow:
   * gasto, cerro limpio, y el informe llego sin bloque legible. La factura de
   * este es PERFECTAMENTE legible — se tiraba por el camino, no por falta.
   */
  | 'informe-ilegible'

/**
 * Un intento de escaneo que no llego a informe, con lo que costo.
 *
 * Nace porque `Result<T>` solo es generico en `T`: al convertir el fallo a
 * `err(string)` se perdian la factura, las herramientas y la duracion, y despues
 * ya no habia de donde sacarlas. Esto las saca ANTES de esa conversion.
 */
export interface IntentoFallido {
  readonly projectId: string
  readonly motivo: MotivoDelFallo
  readonly durationMs: number
  /** La factura REAL del CLI. Un intento que gasto y no consta es la brecha
   *  que este arco cierra: nunca mas un token gastado en silencio. */
  readonly usage: TokenUsage
  readonly tools: readonly string[]
  /** El modelo que DE VERDAD corrio en el intento, si el CLI lo dijo. */
  readonly modelo?: string
  /** La salida cruda, para que el fallo tambien deje transcripcion. */
  readonly texto: string
  /**
   * Lo que el agente noto de FORTRESS en el intento que NO llego a informe
   * (ADR-085). Viaja por aqui por la misma razon que la factura: `Result` solo
   * es generico en su valor, y al convertir el fallo a `err(string)` estas se
   * perdian con el resto.
   *
   * Un informe ilegible no invalida la nota: `notes` es clave HERMANA de
   * `findings` y la valida `toSelfNotes` por su cuenta, asi que se lee bien
   * aunque ningun hallazgo lo haga (medido). Tirarla era perder el unico
   * aprendizaje que dejaba un escaneo ya pagado.
   */
  readonly notas: readonly SelfNoteDraft[]
}
