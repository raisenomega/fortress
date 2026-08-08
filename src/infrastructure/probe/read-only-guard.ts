import { rmSync } from 'fs'
import type { IntegrityReport } from '@domain/probe/integrity'
import { restore } from './restore'
import { takeSnapshot } from './snapshot'
import { verify } from './verify'

export interface Guarded<T> {
  readonly value: T
  readonly integrity: IntegrityReport
}

/**
 * Defensa en profundidad para que auditar no deje rastro. Tres capas que se
 * verifican entre si (para que algo se escape tienen que fallar las tres):
 *  CAPA 1 `takeSnapshot`  — foto "antes" (hash + copia byte-a-byte)
 *  CAPA 2 `restore`       — borra lo nuevo, restaura lo modificado/borrado
 *  CAPA 3 `verify`        — re-hashea todo y compara; NO se cree a si mismo
 * La CAPA 4 (circuit breaker) la dispara el caso de uso cuando `integrity` no esta
 * limpio: marca el proyecto CONTAMINADO y exige intervencion humana.
 */
export async function readOnly<T>(
  projectPath: string,
  work: () => Promise<T>
): Promise<Guarded<T>> {
  const snap = takeSnapshot(projectPath)
  let value: T | undefined
  let failure: unknown
  try {
    value = await work()
  } catch (error) {
    failure = error
  }
  restore(projectPath, snap)
  const integrity = verify(projectPath, snap)
  rmSync(snap.copyDir, { recursive: true, force: true })
  if (failure) throw failure
  return { value: value as T, integrity }
}
