import type { ScanLogWriter } from '@domain/scan/scan-log'
import { SIN_LOG } from '@domain/scan/scan-log'
import type { ParadaEnCurso } from '@domain/scan/scan-chunk'

/**
 * Los dos canales del progreso, separados por lo que puede llevar un secreto.
 *
 * `texto` es salida del agente leyendo el repo auditado: pasa por el tachado en
 * vivo, como el chat. `parada` son tres numeros que compone el recorrido a
 * partir del manifiesto — no los escribe ningun modelo, no pueden arrastrar una
 * clave, y meterlos por el redactor obligaria a cambiar la firma de
 * `sinSecretosEnVivo`, que es innegociable.
 *
 * Que sean dos funciones y no una con un parametro opcional es lo que hace esa
 * separacion imposible de saltarse por descuido.
 */
export interface ProgresoDelRecorrido {
  texto(delta: string): void
  parada(enCurso: ParadaEnCurso): void
}

/** Para quien no pinta nada (tests, caminos sin ventana). */
export const SIN_PROGRESO: ProgresoDelRecorrido = {
  texto: () => undefined,
  parada: () => undefined
}

/**
 * Donde escribe el recorrido lo que NO es base de datos. Va aparte de los
 * frenos a proposito: `RecorridoDeps` tiene que seguir gritando que lo unico
 * que puede pararlo es cancelar, y una salida no para nada.
 */
export interface SalidasDelRecorrido {
  readonly progreso: ProgresoDelRecorrido
  readonly scanLog: ScanLogWriter
}

export const SIN_SALIDAS: SalidasDelRecorrido = { progreso: SIN_PROGRESO, scanLog: SIN_LOG }
