/**
 * El orden en que se atienden los candidatos, una vez medida su superficie.
 *
 * Antes desempataba la ruta alfabetica, y eso creaba un punto ciego PERMANENTE:
 * el punto ordena antes que cualquier letra, asi que `.env` ganaba todos los
 * turnos del proyecto y las carpetas de letra alta no se auditaban nunca. No es
 * que tuvieran mala suerte; es que una casualidad tipografica se habia
 * convertido en politica de auditoria.
 *
 * Lo sustituyen dos criterios que si dicen algo, y los dos comparten una
 * propiedad que el motor exige y que no es obvia: SOBREVIVEN AL CONSUMO. El
 * motor elige de a uno por ciclo sobre un pozo que mengua, asi que un criterio
 * solo sirve si sigue discriminando despues de retirar al ganador.
 *
 *   1. ANTIGUEDAD — el mas viejo sin atender, primero. Quien espera, sube.
 *      Sobrevive porque la fecha es INTRINSECA: retirar a uno no mueve la de
 *      nadie, y la secuencia ciclo a ciclo coincide con el orden estatico.
 *   2. COLA DEL DIRECTORIO — de la carpeta con menos candidatos pendientes,
 *      primero. Sobrevive porque la carga CAMBIA al retirar: la preferencia se
 *      desplaza sola, sin que nadie recuerde nada.
 *
 * Un reparto por turnos rotatorios se descarto por medida, no por gusto:
 * recalculado en cada ciclo devuelve a todos los directorios al turno cero y
 * vuelve a decidir el alfabeto — es el punto ciego otra vez, con otro nombre.
 * Repartir turnos exige recordar a quien le toco, y el selector no recuerda.
 *
 * SESGO DECLARADO: vaciar primero las carpetas escasas es terminar lo que casi
 * esta terminado. Va DETRAS de la antiguedad, asi que una carpeta cargada no se
 * pospone indefinidamente: solo cede el turno dentro de su estrato de fecha.
 */

/** El directorio del fichero. La RAIZ no sirve para repartir: una sola carpeta
 *  puede acaparar dos tercios del pozo y el reparto no cambiaria nada. */
export function directorio(file: string): string {
  const corte = file.lastIndexOf('/')
  return corte === -1 ? '.' : file.slice(0, corte)
}

/** Cuantos candidatos pendientes tiene cada directorio. Una pasada sobre la
 *  lista presente; el comparador solo consulta. Sin historial: es una foto de
 *  lo que queda, y por eso cambia sola conforme el pozo se vacia. */
export function cargaPorDirectorio(
  candidatos: readonly { readonly file: string }[]
): ReadonlyMap<string, number> {
  const carga = new Map<string, number>()
  for (const c of candidatos) {
    const dir = directorio(c.file)
    carga.set(dir, (carga.get(dir) ?? 0) + 1)
  }
  return carga
}
