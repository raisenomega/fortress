import type { ObservationStatus } from '@domain/system/self-observation'

/**
 * El estado de una observacion, en color. `Record` COMPLETO y no `Partial`: si
 * el vocabulario gana un estado, esto deja de compilar y alguien decide su
 * color, en vez de que aparezca en gris por defecto sin que nadie lo note.
 *
 * Los tres salen de la escala de FORTRESS, no de un verde cualquiera: el mismo
 * `--success` de una dimension solida, el mismo `--medium` de lo aceptable, el
 * mismo `--critical` de lo grave. Que el ojo ya sepa leerlos es el punto.
 *
 * El descarte va en rojo y no en gris a proposito. Gris seria "esto ya no
 * importa", y es lo contrario: un descarte dice que el defecto SIGUE AHI y se
 * juzgo que no procede. Eso pide mirada, no archivo.
 */
export const TONO_ESTADO: Readonly<Record<ObservationStatus, string>> = {
  pendiente: 'text-medium',
  atendido: 'text-success',
  descartado: 'text-critical'
}

export const PUNTO_ESTADO: Readonly<Record<ObservationStatus, string>> = {
  pendiente: 'bg-medium',
  atendido: 'bg-success',
  descartado: 'bg-critical'
}
