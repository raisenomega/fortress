import type { Result } from '@domain/shared/result'

/** Puente de construccion (preload). Fase 1 disena el plan; fase 2 lo construye
 *  con red git+verify, solo despues de que el humano aprueba el plan. */
export interface BuildApi {
  plan(projectId: string, intent: string): Promise<Result<string>>
  /** Investigacion en solo lectura: el agente responde, no toca nada. */
  investigate(projectId: string, intent: string): Promise<Result<string>>
  /** Chat LIBRE (PASO 91): conversa sin repo, powers-off. El hilo viaja porque
   *  cada corrida del CLI es una sesion nueva. */
  libre(pregunta: string, hilo: readonly { role: 'user' | 'assistant'; text: string }[]): Promise<Result<string>> // prettier-ignore
  /** Modo CTO (PASO 126): planifica sin repo con el candado del libre. */
  cto(pregunta: string, hilo: readonly { role: 'user' | 'assistant'; text: string }[]): Promise<Result<string>> // prettier-ignore
  feature(projectId: string, intent: string, plan: string): Promise<Result<void>>
  /** Corta el agente en marcha (plan o build). Devuelve procesos terminados. */
  stop(projectId: string): Promise<number>
  /** Selector de archivo nativo; devuelve la ruta o null si se cancelo. */
  pickFile(): Promise<string | null>
}
