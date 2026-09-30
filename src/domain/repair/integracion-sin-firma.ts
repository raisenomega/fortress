/**
 * Lo que NUNCA se integra solo: el codigo propio de FORTRESS.
 *
 * Vivia en el gate del loop y se muda aqui con ADR-107, que retira el loop. No
 * es una reubicacion de conveniencia: esta garantia nunca fue del loop. El loop
 * tenia la suya —sobre el repo propio corria hasta el gate y no llegaba a
 * juzgar—, y aun asi la via automatica se colaba por otra puerta: el boton de
 * firmar una propuesta parada en GATE pedia el juicio, y el juicio arrastraba la
 * integracion detras. Tres integraciones automaticas del 22 de agosto, las tres
 * sobre este repositorio, entraron por ahi.
 *
 * Que la condicion sea el PROYECTO y no el modo es deliberado: se decide si el
 * arbol vivo se toca solo. Sobre el codigo propio no se toca solo nunca. La
 * firma humana —otro gesto, otro boton, otra funcion— sigue pudiendo, y es la
 * unica que puede.
 */
export const integracionAutomaticaPermitida = (selfRepo: boolean): boolean => !selfRepo

/** Por que no se integro sola. Se asienta y viaja: no es un silencio. */
export const SELF_REPO_EXIGE_FIRMA = 'repo-propio-exige-firma-humana'
