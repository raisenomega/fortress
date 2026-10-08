import type { Carpeta } from '@domain/chat/carpeta-de-chat'
import type { HiloDeChat } from '@domain/chat/hilo-de-chat'
import { useBarraStore } from '../stores/barra-store'
import { nuevoHiloEager } from './barra-del-chat'
import { elPuerto } from './hilo-activo'

/** Los flujos de CARPETA (hermano de barra-del-chat por el techo de lineas):
 *  nuevo-dentro, crear-con-hilo y la lista del acordeon (Revision A). */

/** «+ nuevo chat aqui»: EAGER — nace DENTRO, anidado y activo. */
export const nuevoHiloEnCarpeta = (carpetaId: string): Promise<HiloDeChat> =>
  nuevoHiloEager(carpetaId)

/** Crear carpeta (Revision A): su fila + un hilo eager anidado, desplegado y
 *  activo. Si no escribes, el hilo se limpia al salir; la carpeta se queda. */
export async function crearCarpetaConHilo(nombre: string): Promise<Carpeta> {
  const carpeta = await elPuerto().crearCarpeta(nombre)
  useBarraStore.getState().toggleCarpeta(carpeta.id) // fresca: toggle = desplegar
  await nuevoHiloEnCarpeta(carpeta.id)
  return carpeta
}

export const hilosDeCarpeta = (carpetaId: string): Promise<readonly HiloDeChat[]> =>
  elPuerto().hilosPorCarpeta(carpetaId)
