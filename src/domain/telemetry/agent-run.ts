import type { AgentId } from '../agent/agent'
import type { TokenUsage } from './token-usage'

/**
 * Que provoco la ejecucion: un mensaje del chat, un escaneo, una fase del motor
 * de reparacion (analista, generador o revisor), o un agente auxiliar.
 *
 * `sistema` son los que trabajan para FORTRESS y no para una conversacion ni
 * para el expediente: el juez de aplicabilidad, el build, genesis, los
 * episodios de capacidad, el borrador de agente y el grafo A/B. Clase propia
 * porque `averageRun`, `episodeTally` y `tokensPerRun` se calculan por `kind`:
 * meterlos en `chat` habria corrompido en silencio las metricas del chat con
 * corridas que no son chat.
 */
export type RunKind = 'chat' | 'scan' | 'repair' | 'sistema'

export interface NewAgentRun {
  readonly projectId: string
  /** Null cuando ningun agente concreto se hizo cargo de la peticion. */
  readonly agentId: AgentId | null
  readonly kind: RunKind
  readonly durationMs: number
  readonly failed: boolean
  /**
   * La factura, o `undefined` si no se pudo leer — un SIGKILL antes de que el
   * CLI la emitiera. No es lo mismo que una factura de ceros: aquella afirma
   * que salio gratis. La corrida se asienta igual, y su duracion con ella.
   */
  readonly usage?: TokenUsage
  /** Herramientas usadas, en orden de uso. NOMBRES: es lo que FORTRESS aprende. */
  readonly tools: readonly string[]
  /**
   * El RECIBO (ADR-093 §3): que corrio cada herramienta, no solo cual se uso.
   * Llega SIN tachar y se tacha en la ultima puerta antes del disco
   * (`toRunInsert`), nunca por el camino: un tachado que dependa de quien llama
   * se salta enhebrando por otro lado.
   *
   * Opcional a proposito. Una corrida sin recibo es una corrida de la que no se
   * capturo —un motor viejo, un fixture—, y eso es `null` en la columna: «no lo
   * se», que no es lo mismo que «no corrio nada».
   */
  readonly recibo?: readonly string[]
}

/**
 * Una corrida YA asentada. Aqui `usage` vuelve a ser obligatorio: las columnas
 * son NOT NULL, asi que una fila siempre trae cuatro numeros. Lo que dice si
 * esos numeros son MEDIDA —y no un cero de relleno— es `usageKnown`.
 */
export interface AgentRun extends NewAgentRun {
  readonly id: string
  readonly at: string
  readonly usage: TokenUsage
  /** `null` en las filas anteriores a la bandera: no se rellenaron hacia atras
   *  porque clasificarlas sin haberlas visto seria inferir. */
  readonly usageKnown: boolean | null
}

/** Acumulado de un agente, para su panel. */
export interface AgentRunTotals {
  readonly runs: number
  readonly failed: number
  readonly edits: number
  readonly usage: TokenUsage
  readonly lastAt: string | null
  readonly lastProjectId: string | null
}

export interface AgentRanking {
  readonly agentId: AgentId
  readonly runs: number
  readonly edits: number
}
