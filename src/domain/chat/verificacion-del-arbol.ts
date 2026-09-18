/**
 * Como quedo el arbol cuando el gate fue a mirarlo (ADR-091).
 *
 * Eran dos estados y tenian que ser TRES. El booleano no podia decir «no lo se»,
 * asi que `false` significaba a la vez «tu fix rompio esto» y «aqui no hay con
 * que compilar» — dos cosas opuestas bajo la misma palabra. El 18-sep eso costo
 * un turno entero: el proyecto llego sin `node_modules`, `tsc` no existia, el
 * gate dijo `false`, y un fix correcto se revirtio por el estado en que estaba
 * el arbol ANTES de que el agente lo tocara. El productor dio 51 vueltas en un
 * camino que ya estaba cerrado antes de su primera edicion.
 *
 * DESCONOCIDA y no «omitida» ni «saltada», y el nombre importa mas que el tipo:
 * «omitida» suena a decision de alguien —elegi no correrlo—, y aqui nadie
 * eligio nada. «Desconocida» es lo que de verdad paso: se intento, y no se pudo
 * saber. Un nombre que se lea como decision invita, dentro de seis meses, a
 * usarlo para saltarse comprobaciones a proposito.
 *
 * Lo que NUNCA puede pasar es que `desconocida` se lea como verde. Verde es
 * «lo mire y esta bien»; desconocida es «no pude mirarlo». Por eso no hay
 * ningun helper que las junte, y por eso viaja al parte (ADR-091 §4): el
 * operador decide con el dato delante, no con un silencio.
 */
export type VerificacionDelArbol = 'verde' | 'rojo' | 'desconocida'

/**
 * Si este veredicto tumba el turno. SOLO el rojo: un rojo es el arbol diciendo
 * que algo se rompio, y eso se deshace. Desconocida no tumba nada —castigar al
 * fix por un terreno que no se pudo medir es el freno que ADR-091 viene a
 * quitar— pero tampoco absuelve: se cuenta, en el parte.
 */
export function cortaElTurno(v: VerificacionDelArbol): boolean {
  return v === 'rojo'
}

/** Lo que se comprobo de verdad. Ni `desconocida` ni `rojo` lo son. */
export function seVerifico(v: VerificacionDelArbol): boolean {
  return v === 'verde'
}
