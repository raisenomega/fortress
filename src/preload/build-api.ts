import type { Result } from '@domain/shared/result'

/** Puente de construccion (preload). Fase 1 disena el plan; fase 2 lo construye
 *  con red git+verify, solo despues de que el humano aprueba el plan. */
export interface BuildApi {
  plan(projectId: string, intent: string): Promise<Result<string>>
  feature(projectId: string, intent: string, plan: string): Promise<Result<void>>
}
