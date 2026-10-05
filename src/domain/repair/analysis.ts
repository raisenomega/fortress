import type { SelfNoteDraft } from '../system/self-observation'
import type { TokenUsage } from '../telemetry/token-usage'
import type { Evidencia } from './evidencia-obsolescencia'
import type { Arreglo } from './leer-arreglo'
import type { Candidate } from './select-target'
import type { JuicioDelModelo } from '../agent/guardia-del-modelo'

/**
 * Entendimiento INERTE de un hallazgo: que cambiar, donde, que patron copiar, que NO
 * tocar y el riesgo. Es el borrador del ENTENDIMIENTO (C2), no el del fix (C3).
 */
export interface Analysis {
  readonly target: Candidate
  /** Veredicto verificado contra el archivo real: "REAL" (accionable) u "OBSOLETO". */
  readonly status: string
  /** La prueba del OBSOLETO, y la unica llave que abre la extincion: un marcador
   *  que debe estar AUSENTE del fichero —el defecto se fue— o PRESENTE —existe
   *  el control que lo tapa—. Sin ella el hallazgo no muere: se mitiga. */
  readonly evidencia?: Evidencia
  readonly whatToChange: string
  readonly where: string
  /** El patron a copiar y de donde (guardRun en scan-handlers/quality-handlers). */
  readonly patternToCopy: string
  readonly doNotTouch: string
  readonly risk: string
  /** Tokens que costo el analisis (grafo-primero deberia ser barato). */
  readonly tokensUsed: number
  /** Lo que el analista noto de FORTRESS MISMA (una herramienta que le falto, un
   *  permiso que le corto): no es del proyecto auditado, es para que FORTRESS madure. */
  readonly notes?: readonly SelfNoteDraft[]
  readonly arreglo?: Arreglo // donde VA el cambio (ADR-102 §2): el guard lo contrasta con la correa antes de generar
  readonly mismoDefectoQue?: readonly string[] // citados que juzga el MISMO defecto (ADR-101 §3): se funden
}

/** REAL y accionable (no obsoleto): C3 solo debe proponer sobre esto. */
export function isActionable(a: Analysis): boolean {
  return a.status.trim().toUpperCase() === 'REAL'
}

/** Metadatos de la corrida del analista: lo que costo y cuanto tardo. */
export interface AnalystRunMeta {
  /** Id de su fila en agent_runs. Ausente solo si la corrida no se pudo
   *  asentar —factura ilegible o fallo de escritura—, nunca por no intentarlo. */
  readonly agentRunId?: string
  /** undefined si el parser no pudo extraerlo: no se inventan numeros. */
  readonly tokensUsed?: number
  /** La factura entera del CLI (los cuatro contadores: el cache no cuesta lo
   *  mismo que el input). `tokensUsed` es el total que gobierna el tope. */
  readonly usage?: TokenUsage
  readonly durationMs: number
  /** El modelo que DE VERDAD corrio, y su juicio (ADR-078, enmienda). */
  readonly model?: string
  readonly juicioModelo?: JuicioDelModelo
  readonly startedAt: number
  readonly endedAt: number
}

/** El entendimiento MAS su factura: el analisis nunca viaja sin su coste. */
export interface AnalystResult {
  readonly analysis: Analysis
  readonly runMeta: AnalystRunMeta
  /** El texto ENTERO del analista, solo cuando no se dejo leer: la muestra del
   *  asiento es legible, pero con ella no se reproduce el fallo. */
  readonly raw?: string
}

/** Puerto: el analista grafo-primero que ESTUDIA el hallazgo. Infra lo implementa.
 *  `atendidas` son las lineas YA saneadas y formateadas de lo que FORTRESS trato
 *  (vacio = sin seccion). Viajan formateadas, nunca crudas: quien las convierte
 *  en texto es el dominio, no el adaptador que las mete en el prompt. */
export interface Analyst {
  study(target: Candidate, atendidas: readonly string[]): Promise<AnalystResult>
}
