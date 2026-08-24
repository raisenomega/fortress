import type { AgentId } from '../agent/agent'
import type { TokenUsage } from './token-usage'

/** Que provoco la ejecucion: un mensaje del chat, un escaneo, o una fase del
 *  motor de reparacion (analista, generador o revisor). */
export type RunKind = 'chat' | 'scan' | 'repair'

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
  /** Herramientas usadas, en orden de uso. */
  readonly tools: readonly string[]
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
