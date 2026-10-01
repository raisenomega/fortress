/**
 * Lo que el gate ABSOLVIO, dicho donde se lee.
 *
 * EL MECANISMO NO SE DISCUTE: cuando un comando falla, el gate vuelve a la base,
 * lo corre ahi, y si ya estaba rojo no se lo achaca al fix —«exigirle a un fix
 * que deje verde un arbol que ya estaba rojo antes de tocarlo es pedirle que
 * arregle el proyecto entero para arreglar una linea»—. Es buena ingenieria y
 * sigue igual. Lo que faltaba era que su CONSECUENCIA se viera.
 *
 * POR QUE EXISTE, medido el 2026-09-30. Desde el 10-sep `test:unit` estaba rojo
 * en la base de todo worktree (el kit del escaneo no viaja a un worktree), asi
 * que se heredaba SIEMPRE y el gate pasaba con esa prueba apagada. Sobre
 * FORTRESS: 44 gates verdes, **12 con heredado —los doce `test:unit`—**, y
 * **OCHO fixes llegaron a MERGEADO sin verificar los tests**, siete firmados por
 * el operador el 14-sep. El gate NO mentia: lo anoto en el libro doce veces,
 * desde el 21-ago. **Nadie leyo el acta.** No era un juez ciego que condenaba:
 * era un juez al que le habian quitado una prueba y lo decia en la evidencia,
 * detras de dos clics, en JSON crudo.
 *
 * UN VERDE CON HERENCIA NO ES UN VERDE LIMPIO, y los dos tienen que leerse
 * distinto: en el prompt de OMEGA, en la linea que el operador lee antes de
 * firmar, y en el parte del drenaje. Es el mismo principio que el contrato del
 * kit y que la nota de barrera: **lo no verificado se declara donde se lee, no
 * se entierra.**
 *
 * EL CASO LIMPIO NO PAGA NADA: sin herencia devuelve `null` y todo queda
 * exactamente como estaba. El aviso solo aparece cuando hay algo que avisar.
 */
export function avisoDeHerencia(heredado: readonly string[] | undefined): string | null {
  if (heredado === undefined || heredado.length === 0) return null
  const cuales = [...heredado].join(', ')
  return `${cuales} heredado de la base, NO verificado`
}

/** La linea del gate para quien juzga y para quien firma. `verde` a secas
 *  cuando no hay nada heredado: ni una palabra de ruido en el caso normal. */
export function gateEnUnaLinea(verde: boolean, heredado: readonly string[] | undefined): string {
  const aviso = avisoDeHerencia(heredado)
  const estado = verde ? 'verde en todos los comandos' : 'NO verde'
  return aviso === null ? estado : `${estado.replace('en todos los comandos', 'CON HERENCIA')} (${aviso})` // prettier-ignore
}
