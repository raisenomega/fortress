import { classifyFailure } from '@domain/loop/failure-kind'
import type { Result } from '@domain/shared/result'

/** Cancelacion humana durante el ciclo: rompe el loop limpiamente. */
export class LoopCancelled extends Error {}
/** Fallo terminal (no transitorio): el loop no puede seguir por si solo. */
export class LoopTerminal extends Error {}

export interface StandbyHooks {
  readonly isCancelled: () => boolean
  /** Aviso de que se entra en standby por un fallo transitorio. */
  readonly onStandby: (error: string) => void
  /** Espera interrumpible: resuelve al pasar ms o antes si se cancela. */
  readonly waitOrCancel: (ms: number) => Promise<void>
}

/** Cuanto espera entre reintentos mientras el proveedor no se recupera. */
export const STANDBY_MS = 60_000

/**
 * Ejecuta una operacion que puede fallar. Si el fallo es transitorio (API,
 * credito agotado, red) entra en STANDBY y reintenta hasta que el proveedor se
 * recupere: nada se pierde, se sigue donde se quedo. Si es terminal, lanza
 * LoopTerminal. Si el humano cancela, lanza LoopCancelled.
 */
export async function withStandby<T>(op: () => Promise<Result<T>>, hooks: StandbyHooks): Promise<T> {
  for (;;) {
    if (hooks.isCancelled()) throw new LoopCancelled()

    const result = await op()
    if (result.ok) return result.value
    if (classifyFailure(result.error) === 'terminal') throw new LoopTerminal(result.error)

    hooks.onStandby(result.error)
    await hooks.waitOrCancel(STANDBY_MS)
  }
}
