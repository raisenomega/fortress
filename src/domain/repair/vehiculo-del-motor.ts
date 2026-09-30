/**
 * De quien es el Motor de reparacion, y de quien no (ADR-107).
 *
 * LOS DOS MUNDOS. El Motor se creo para que FORTRESS se repare a si misma: sus
 * frenos —la firma humana, DEBUT, los innegociables, los topes— existen por eso.
 * El cliente tiene su propia herramienta, el Terminal, que resuelve CUALQUIER
 * severidad sobre su codigo. Confundirlas no es un detalle de encaminamiento:
 * lleva las prudencias de una al terreno de la otra y deja al cliente con una
 * puerta que no es la suya.
 *
 * ADR-063 abrio el Motor a cualquier proyecto en agosto, y fue correcto
 * ENTONCES: no habia Terminal de grado bancario para el cliente. Ahora lo hay, y
 * lo que se supera es el VEHICULO, no la capacidad.
 *
 * Esto se pregunta en el NACIMIENTO de la propuesta y no en los bordes: los tres
 * disparadores —Drenaje, boton y el LOOP que ADR-107 retira— pasaban por ahi, y
 * una guarda por borde depende de que alguien se acuerde del cuarto.
 */
export const NO_ES_SU_VEHICULO = 'no-es-su-vehiculo'

/** El texto que ve quien lo pide: dice a donde ir, no solo que no. */
export const VA_POR_EL_TERMINAL =
  'El Motor repara FORTRESS. Este proyecto se repara por el Terminal.'

/** true si el Motor puede trabajar ahi. Solo el repo propio. */
export function esVehiculoDelMotor(esRepoPropio: boolean): boolean {
  return esRepoPropio
}
