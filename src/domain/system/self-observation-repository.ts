import type { NewSelfObservation, ObservationStatus, SelfObservation } from './self-observation'

/** Puerto del backlog de auto-mejora de FORTRESS. Sobrevive a que se quite el
 *  proyecto origen: es sobre FORTRESS, no sobre el proyecto. */
export interface SelfObservationRepository {
  /**
   * Asienta lo que un agente noto. NO siempre abre fila: si ya hay una PENDIENTE
   * del mismo `kind` y `area` le anade un AVISTAMIENTO en vez de duplicarla
   * (ADR-085, Fase 4). Devuelve la fila que quedo, nueva o existente.
   */
  add(observation: NewSelfObservation): SelfObservation
  /** En cuantos PROYECTOS distintos se ha visto. La senal que ordena el backlog:
   *  tres clientes con el mismo hueco valen mas que treinta avisos de uno. */
  vistaEn(observationId: string): number
  /** Pendientes (no atendidas ni descartadas), del mas reciente al mas antiguo. */
  listOpen(): readonly SelfObservation[]
  /**
   * Las CERRADAS (atendidas o descartadas), de la mas reciente a la mas vieja.
   * Lo contrario de `listOpen`, y para lo contrario: no lo que queda por hacer,
   * sino lo que ya se trato — el material con el que un agente sabe que un tema
   * ya paso por aqui y no hace falta que lo vuelva a levantar.
   *
   * El tope va en el SQL y no en memoria: traer trescientas filas para quedarse
   * con cuarenta es trabajo que la base hace mejor.
   *
   * ORDEN EXIGIDO: `attended_at` descendente, y DESEMPATADO. La recencia sola
   * bastaba mientras las observaciones se cerraban de una en una; en cuanto se
   * cerro la primera TANDA, ciento diecisiete compartieron el mismo instante y
   * el tope empezo a cortar dentro del empate por donde la base quisiera —dos
   * llamadas iguales, dos listas distintas—. Desempata `created_at` descendente,
   * que dentro de una tanda pone delante lo observado mas fresco (lo que mas
   * riesgo tiene de repetirse), y cierra el `id`, que es unico: el corte es
   * siempre el mismo.
   */
  listClosed(limite: number): readonly SelfObservation[]
  /**
   * TODAS, en el orden en que se observaron. No es `listOpen` mas `listClosed`:
   * es la otra pregunta. Aquellas dos sirven al trabajo —que queda por hacer,
   * que recordarle al analista—; esta sirve a MIRAR, y para mirar el estado no
   * es un filtro sino un color. Con las cerradas fuera, el panel no podia
   * enseñar que se atendio nada: solo sabia pintar lo que faltaba.
   *
   * Por `created_at` y no por estado: agrupar los pendientes delante dejaria las
   * primeras veintidos paginas de un solo color y las cerradas al final, que es
   * justo lo contrario de ver la mezcla. La cuenta por estado va en la cabecera.
   */
  listAll(): readonly SelfObservation[]
  /** Una cualquiera, en el estado que este. La importacion la mira ANTES de
   *  cerrarla para saber si esta pisando un cierre anterior. */
  findById(id: string): SelfObservation | null
  /**
   * Cierra una observacion diciendo en que quedo, quien y por que. Devuelve si
   * cambio algo: el `WHERE id = ?` que no encuentra nada es como se detecta un
   * id inexistente sin una consulta previa (patron de `markMitigated`).
   */
  setStatus(entrada: CambioDeEstado): boolean
}

/** Lo que hace falta para cerrar una observacion. */
export interface CambioDeEstado {
  readonly id: string
  readonly status: ObservationStatus
  readonly reason: string | null
  readonly attendedBy: string
  readonly attendedAt: string
}
