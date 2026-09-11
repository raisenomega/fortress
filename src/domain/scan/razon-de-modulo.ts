import { NOMBRE_MODULO, type ModuloAuditoria } from './modulo-auditoria'
import { senalesDe } from './senales-derivadas'

/**
 * Por que un modulo no entra. Existe porque la decision 4 de ADR-083 exige que
 * lo descartado se DECLARE: un modulo saltado en silencio es indistinguible de
 * uno olvidado, y esa diferencia es la que una auditoria tiene que demostrar.
 *
 * Las razones se derivan de las tablas de senales, no se escriben a mano: una
 * senal nueva aparece sola en el texto del descarte.
 */
const nombrado = (modulo: ModuloAuditoria): string => `${modulo} ${NOMBRE_MODULO[modulo]}`

/** Se busco su senal y no estaba. Dice QUE se busco, no solo que no aplica. */
export const razonSinSenal = (modulo: ModuloAuditoria): string =>
  `${nombrado(modulo)}: no aplica, no hay ${senalesDe(modulo).join(', ')}`

/** No hay senal de fichero que valga: «toca valor» no es una dependencia. */
export const razonNoSeDecide = (modulo: ModuloAuditoria): string =>
  `${nombrado(modulo)}: no consta, no se decide por fichero; falta la declaracion del operador o el juicio con evidencia`

/** Quien declara sabe mejor, tambien para decir que no. */
export const razonDeclaradoNo = (modulo: ModuloAuditoria): string =>
  `${nombrado(modulo)}: no aplica, declarado por el operador`

/** Lo juzgo un agente y trajo la prueba: la razon la CITA, no la resume. */
export const razonJuzgadoNo = (modulo: ModuloAuditoria, porque: string): string =>
  `${nombrado(modulo)}: no aplica, juzgado con evidencia — ${porque}`

/** Se juzgo y no se pudo concluir, o el juicio llego sin cita comprobable. */
export const razonJuicioSinEvidencia = (modulo: ModuloAuditoria): string =>
  `${nombrado(modulo)}: no consta, el juicio no trajo una cita de codigo que lo respalde`
