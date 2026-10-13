import type { DesenlaceDelCierre } from '@domain/chat/cierre-del-ciclo'
import type { SinCierre } from '@domain/chat/motivo-sin-cierre'

/** Lo que el turno deja para el parte: la guarda que cortó (si cortó) Y el
 *  DESENLACE real del cierre — señal POSITIVA, no ausencia: solo los tres de
 *  verificación son un dictamen. `null` = no se cerró (una guarda lo cortó). */
export interface CierreDelTurno {
  readonly sinCierre: SinCierre | null
  readonly desenlace: DesenlaceDelCierre
}
