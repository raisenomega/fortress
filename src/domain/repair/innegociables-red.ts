/**
 * La CUARTA familia del criterio innegociable: la red de reversion del ADR-079,
 * que impide editar el arbol vivo sin poder deshacerlo.
 *
 * Sale a su propio modulo por la misma razon que las otras: la lista llego a su
 * techo de lineas y el corte se hace por familia. Y entra entera —las dos
 * mitades— porque el fallo de siempre es proteger una y dejar la otra: aqui
 * `checkpoint-transitorio` MONTA y retira el checkpoint, y `con-red-de-reversion`
 * DECIDE que sin el no se produce. Proteger solo al que monta dejaria cambiar al
 * que decide, y la red se apagaria sin tocar un fichero protegido.
 */
export const DEFENSAS_DE_LA_RED: readonly string[] = [
  'src/infrastructure/git/checkpoint-transitorio.ts',
  'src/application/chat/con-red-de-reversion.ts'
]
