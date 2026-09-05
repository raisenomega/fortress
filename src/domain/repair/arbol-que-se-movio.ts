/**
 * Si el arbol que se va a integrar hay que volver a medir, y por que casi nunca.
 *
 * El gate de una propuesta corre en su worktree, anclado a un baseSha. Cuando el
 * destino avanza entre esa medida y la integracion, lo que entra ya no es lo que
 * se valido. Git solo frena los choques TEXTUALES, y dos arreglos del mismo
 * defecto por vias OPUESTAS caben en lineas distintas del mismo fichero sin
 * chocar: eso paso el 5 de septiembre —una propuesta anclada nueve merges atras
 * recorto una ruta que el destino ya habia decidido rechazar— y dejo el destino
 * en rojo. De seis integraciones intentadas esa noche, cinco se salvaron porque
 * chocaron de texto. La sexta no choco.
 *
 * Volver a medir cada vez que el destino se mueva NO vale, y el dato lo dice: la
 * firma llega en tandas —cinco en quince segundos, medidas en agosto— y a partir
 * de la segunda el destino siempre se ha movido, porque lo movio la primera. Esa
 * condicion se cumpliria siempre y convertiria quince segundos de clics en media
 * hora de gates en cola. Lo que se mira no es si se movio: es si se movio SOBRE
 * LO MISMO.
 */
export function ficherosEnComun(
  delFix: readonly string[],
  delDestino: readonly string[]
): readonly string[] {
  const destino = new Set(delDestino)
  return delFix.filter((fichero) => destino.has(fichero))
}

/**
 * Tocar esto invalida cualquier medida hecha sin reinstalar: el `node_modules`
 * que el gate dejo en el worktree es el del baseSha, y un arbol integrado que
 * cambia las dependencias ya no es el que ese `node_modules` representa. Medirlo
 * igual daria un verde —o un rojo— sobre unas dependencias que no son las suyas.
 *
 * Lo comparte `gate-baseline`, que descarta la misma medida por el mismo motivo.
 * Una sola lista: dos copias envejecen y la que envejece absuelve de mas.
 */
export const DEPENDENCIAS: readonly string[] = ['package.json', 'package-lock.json']

export function tocaDependencias(ficheros: readonly string[]): boolean {
  return ficheros.some((fichero) => DEPENDENCIAS.includes(fichero))
}
