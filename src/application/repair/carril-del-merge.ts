import type { CarrilDeMerge, ViaDeIntegracion } from './auto-merge-types'

/** Lo que devuelve cuando otro tiene el turno. No es un fallo del merge: es que
 *  no se llego a intentar, y esa diferencia decide si la propuesta muere. */
export const OCUPADO = 'carril-ocupado'

/**
 * El `git merge` del motor, dentro del turno del arbol vivo y SOLO durante el.
 *
 * La rama activa la tocan cuatro cosas —la firma, el push, el boton de OMEGA y
 * la cadena del motor— repartidas entre dos turnos que no se ven: la firma y el
 * push toman el del merge; el motor solo el suyo. Asi que una integracion
 * automatica y una firma manual podian correr A LA VEZ sobre el mismo arbol. La
 * proteccion de git evita que se pisen el indice, pero no salva la pareja: el
 * `git merge --abort` con el que el applier se recupera es del REPOSITORIO
 * entero, asi que el que falla puede deshacer el merge en vuelo del otro.
 *
 * Se toma SOLO aqui y no en toda la vuelta, y eso es la mitad del arreglo. Con
 * el turno cogido durante el analisis, la generacion, el gate y OMEGA, media
 * hora de drenaje dejaria el proyecto cerrado a una firma — que es exactamente
 * el modo inservible por el que existen dos turnos y no uno. Cogido solo en el
 * instante del merge, la razon de los dos turnos sigue en pie.
 *
 * La via FIRMADA no lo pide: su handler YA lo tiene cogido, y volver a pedirlo
 * seria bloquearse contra uno mismo — la firma se diferiria a si misma para
 * siempre. El turno no es reentrante y no tiene por que serlo; lo que hace
 * falta es saber quien ya lo trae puesto.
 */
export async function conCarrilDeMerge<T>(
  carril: CarrilDeMerge,
  projectId: string,
  via: ViaDeIntegracion,
  merge: () => Promise<T>
): Promise<T | typeof OCUPADO> {
  if (via === 'firmada') return merge()
  if (!carril.tomar(projectId)) return OCUPADO

  try {
    return await merge()
  } finally {
    carril.soltar(projectId)
  }
}
