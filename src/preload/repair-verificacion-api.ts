import type { ResultadoVerificacionMasiva } from '@domain/repair/verificacion-masiva'
import type { DictamenDeVerificacion } from '@domain/repair/dictamen-de-verificacion'
import type { Result } from '@domain/shared/result'

/**
 * Comprobar lo que el operador dio por arreglado (ADR-087). Sale de `RepairApi`
 * porque aquello ya estaba en el limite de 75 lineas, y porque es otra cosa: el
 * motor PROPONE fixes y esto no propone nada — solo mira si el fix sirvio.
 */
export interface VerificacionApi {
  /** Comprueba un hallazgo MITIGADO: el analista lee el fichero y dictamina.
   *  NO propone nada y NO crea propuesta. `null` si no esta mitigado o si ya hay
   *  una propuesta viva trabajandolo. */
  verify(projectId: string, findingId: string): Promise<Result<DictamenDeVerificacion | null>>
  /**
   * TODOS los mitigados, uno detras de otro, con la doctrina del escaneo: la
   * lista se fija al arrancar, dentro no hay mas freno que Detener, y al cerrar
   * declara su cobertura. Tarda horas y cuesta dinero: quien lo llama pregunta
   * antes.
   *
   * No devuelve `Result`: `ocupado` viaja en el propio parte porque no es un
   * error, es un freno del sistema haciendo su trabajo.
   */
  verifyAll(projectId: string): Promise<ResultadoVerificacionMasiva>
  /** Detiene el barrido. El mitigado en curso termina y queda escrito; el
   *  siguiente no arranca. Una parada no es un fallo. */
  verifyAllStop(projectId: string): Promise<number>
}
