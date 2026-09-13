import type { ExtinguidoPor } from './extinguido-por'
import type { MotivoExtincion } from './motivo-extincion'

/**
 * Lo que DECIDE sobre un hallazgo, aparte de lo que el escaneo descubre.
 *
 * Sale de `FindingRepository` por la misma linea por la que ya estaban partidos
 * su SQL (`finding-lifecycle-sql`) y sus escrituras (`finding-lifecycle-writes`):
 * nacer y volver a verse es una cosa, y cerrar —o reabrir— es otra. Se leen
 * juntas porque quien toque una tiene que ver las demas: entre las seis esta el
 * ciclo entero, y dejar un estado sin salida es como MITIGATED se volvio una
 * trampa la primera vez.
 */
export interface FindingLifecyclePort {
  /** Extinguir exige DECIR por que —una muerte sin motivo no se audita— y QUIEN
   *  lo pidio: el motivo es el juicio, el quien es de donde salio la pregunta. */
  markExtinct(ids: readonly string[], at: string, motivo: MotivoExtincion, extinguidoPor: ExtinguidoPor): void // prettier-ignore

  /** El dictamen de una re-verificacion que NO cierra: el hallazgo sigue
   *  mitigado y el analista deja escrito por que (ADR-087). */
  anotarVerificacion(findingId: string, note: string): boolean

  /** El analista dijo que el problema SIGUE en el codigo: la marca del operador
   *  era falsa, asi que el hallazgo vuelve a la cola del motor con la razon
   *  delante. Sin esto se quedaba contando para el score y bloqueando el push
   *  mientras el motor no podia tocarlo, porque `vivo` exige ACTIVE. */
  devolverALaCola(findingId: string, note: string): boolean

  /** El operador declara que un hallazgo ya esta ARREGLADO, con una nota que
   *  dice donde. No afirma que haya desaparecido —eso lo confirma un juicio—,
   *  asi que sigue en el tablero; lo que deja es de pedirle trabajo al motor.
   *  false si ya no estaba ACTIVE. */
  markMitigated(findingId: string, note: string, at: string): boolean

  /** El operador deshace su marca: el hallazgo vuelve a la cola. false si no
   *  estaba mitigado. */
  markActive(findingId: string): boolean

  /** Marca un hallazgo como falso positivo y recuerda la decision. */
  dismiss(findingId: string): boolean

  /** Deshace el descarte y vuelve a contar el hallazgo. */
  reopen(findingId: string): boolean
}
