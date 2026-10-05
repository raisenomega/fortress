import type { RejectionReason } from '@domain/repair/repair-rejection'

/** Lo que el generador dice de su propio fallo, y solo el puede decirlo. */
export interface FalloDelGenerador {
  readonly turnosAgotados?: true
  readonly timedOut?: true
  readonly noArranco?: true
  readonly modeloFuera?: true
}

/**
 * Con que nombre muere una generacion fallida.
 *
 * Existe porque durante meses hubo UNO solo para tres cosas distintas, y ese
 * nombre —`generator_error`— decia "el proveedor se cayo" tanto si se habia
 * caido como si el que se agoto era nuestro propio reloj. Costaba caro: parar
 * la tanda entera es lo correcto ante un 429 y un desperdicio ante un plazo,
 * porque la propuesta siguiente puede terminar en tres minutos.
 *
 * El orden importa. El CLI que no arranco va PRIMERO porque excluye a los
 * demas: sin proceso no hubo turnos que agotar ni plazo que cumplir. Y los
 * turnos se miran antes que el reloj: una corrida que
 * agota sus vueltas puede tardar tanto que el plazo la alcance, y decir "se
 * acabo el tiempo" cuando lo que se acabo fueron las vueltas manda a subir el
 * plazo, que no arregla nada. El hecho mas especifico gana.
 */
export function motivoDelGenerador(fallo: FalloDelGenerador): RejectionReason {
  if (fallo.noArranco === true) return 'cli_no_arranco'
  if (fallo.modeloFuera === true) return 'modelo_no_asignado'
  if (fallo.turnosAgotados === true) return 'turnos_agotados'
  if (fallo.timedOut === true) return 'generator_timeout'
  return 'provider_error'
}
