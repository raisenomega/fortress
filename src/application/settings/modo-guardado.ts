import { parseOperationMode, type OperationMode } from '@domain/settings/operation-mode'
import { SETTINGS_KEYS } from '@domain/settings/settings-repository'
import type { AppContext } from '../context'

/**
 * El modo REAL del operador, leido de la base (ADR-097 §4).
 *
 * Existe porque el mensaje MIENTE, y miente a proposito: el turno de PLAN del
 * lote se manda con `mode: 'supervisado'` aunque el proyecto corra en autonomo
 * (`lote-por-enter.ts:33`), para que el productor proponga sin tocar un
 * fichero. Esa mentira es correcta para lo que hace, y por eso nadie va a
 * quitarla — pero significa que `input.mode` NO dice si el proyecto es
 * autonomo.
 *
 * INNEGOCIABLE: la garantia de «en autonomo no se ejecuta sin aprobacion» se
 * apoya en ESTE dato y nunca en `input.mode`. Un mensaje lo compone el renderer
 * y el renderer puede escribir lo que quiera; la fila de `settings` la escribio
 * el operador. Preguntarle al mensaje si el turno es autonomo es preguntarle al
 * que quiere pasar si tiene permiso.
 *
 * Es la doctrina de siempre —la defensa vive donde no se puede esquivar, como
 * el tachado en `toRunInsert` o el critico en `AUDIT_AGENTS`— aplicada al modo:
 * la puerta lee la base, no lo que le traen.
 *
 * Sin valor guardado cae en `supervisado` (`parseOperationMode`), que es el
 * lado seguro: ante la duda, no se ejecuta solo.
 */
export function modoGuardado(context: AppContext): OperationMode {
  return parseOperationMode(context.settings.get(SETTINGS_KEYS.operationMode))
}

/** Si el operador dejo el sistema en autonomo, segun la BASE. */
export function esAutonomoDeVerdad(context: AppContext): boolean {
  return modoGuardado(context) === 'autonomo'
}
