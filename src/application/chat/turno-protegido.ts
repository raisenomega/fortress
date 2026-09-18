import type { VeredictoDelTurno } from '@domain/chat/veredicto-del-turno'
import type { VerificacionDelArbol } from '@domain/chat/verificacion-del-arbol'
import type { ReplyOutcome } from './reply-outcome'

/**
 * Como acabo un turno del Terminal: lo que produjo, lo que se decidio con ello,
 * y por que. Vive aparte de `conRedDeReversion` porque lo leen cinco sitios
 * —el cierre del ciclo, la memoria por hallazgo, el parte del lote, el ciclo de
 * convergencia y el propio turno— y ninguno necesita la funcion que lo crea.
 */
export interface TurnoProtegido {
  readonly outcome: ReplyOutcome
  /** Lo que se le anade al texto de la respuesta: vacio si no hubo que decir nada. */
  readonly aviso: string
  /** La red estaba puesta y el turno se quedo en el arbol. Sin red es false: nada
   *  garantiza lo que quedo, y el cierre del ciclo (ADR-088) solo se fia de esto. */
  readonly conservado: boolean
  /** La red estaba puesta y DESHIZO el turno. NO es lo contrario de `conservado`:
   *  sin red los dos son false —nadie conservo ni revirtio nada—, y la memoria
   *  por hallazgo (ADR-088, Enmienda 2) necesita distinguir ese caso. */
  readonly revertido: boolean
  /** Lo que OMEGA dictamino, si hubo juicio (ADR-090). Sin juez: `juzgado:false`. */
  readonly veredicto: VeredictoDelTurno
  /**
   * Como quedo el arbol cuando el gate fue a mirarlo (ADR-091). Viaja para que
   * un `desconocida` NO pueda conservarse en silencio: lo que se quedo escrito
   * sin haberse compilado tiene que poder contarse, y esto es de donde sale.
   *
   * Es `verde` tambien cuando no habia nada que verificar —turno sin ediciones,
   * o fallido antes de llegar al gate—: ahi no hay nada que contar, y llamarlo
   * `desconocida` haria ruido en el parte por turnos que no tocaron el arbol.
   */
  readonly arbol: VerificacionDelArbol
}

/**
 * El turno se quedo escrito y NADIE pudo compilar el proyecto (ADR-091). Las dos
 * condiciones juntas: un turno revertido no conserva nada, y uno verificado en
 * verde no tiene nada que avisar. Vive aqui, con el tipo del que se deduce.
 */
export function seConservoSinCompilar(t: TurnoProtegido): boolean {
  return t.conservado && t.arbol === 'desconocida'
}
