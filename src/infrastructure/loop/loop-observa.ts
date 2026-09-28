import type { AppContext } from '@application/context'
import { asentarNotas } from '@application/system/asentar-notas'
import { observacionDeParada, observacionDeStandby } from '@domain/loop/observacion-de-parada'
import type { Project } from '@domain/project/project'
import type { Parada } from './loop-stop-record'

/**
 * El loop asienta lo SUYO por el cuello unico (ADR-085): su escaneo y su motor
 * ya observaban por su cuenta, pero la parada y el standby solo quedaban en
 * `loop_sessions` y en un aviso al renderer que nadie guardaba.
 */
export function observarParada(context: AppContext, project: Project, parada: Parada): void {
  // El detalle CRUDO no viaja a la nota: para eso esta la clase (ver `claseDelFallo`).
  const nota = observacionDeParada(parada.stoppedReason, parada.stoppedReasonDetail ?? null, parada.claseDelFallo ?? null) // prettier-ignore
  if (nota !== null) asentarNotas(context, project, [nota])
}

export function observarStandby(context: AppContext, project: Project, error: string): void {
  asentarNotas(context, project, [observacionDeStandby(error)])
}
