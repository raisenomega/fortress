import { useBarraStore } from '../stores/barra-store'
import { borrarHiloYLimpiar } from './barra-del-chat'
import { confirmador } from './confirmador'
import { elPuerto } from './puerto-de-hilos'

/** La gestion del ⋯ de un HILO (Revision B, PASO 121): renombrar, mover y
 *  eliminar confirmado. Cada gesto refresca las listas de la barra. */
const refrescar = (): void => useBarraStore.getState().refrescar()

/** RENAME MANDA: lo escrito a mano es el titulo; vacio no renombra nada. */
export async function renombrarHilo(id: string, titulo: string): Promise<void> {
  const limpio = titulo.trim()
  if (limpio === '') return
  await elPuerto().renombrarHilo(id, limpio)
  refrescar()
}

/** Mover a carpeta (o a NULL = Sin carpeta): sale de donde estaba. */
export async function moverHilo(id: string, carpetaId: string | null): Promise<void> {
  await elPuerto().moverHilo(id, carpetaId)
  refrescar()
}

/** Eliminar con CONFIRMACION: cancelar no borra nada. true = borrado. */
export async function eliminarHilo(id: string, titulo: string): Promise<boolean> {
  if (!confirmador(`¿Eliminar «${titulo}» y sus mensajes? No se puede deshacer.`)) return false
  await borrarHiloYLimpiar(id)
  refrescar()
  return true
}
