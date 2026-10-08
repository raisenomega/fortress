import { useBarraStore } from '../stores/barra-store'
import { useConstruirStore } from '../stores/construir-store'
import { confirmador } from './confirmador'
import { elPuerto } from './puerto-de-hilos'
import { pintarHilo } from './rehidratar-el-hilo'

/** La gestion del ⋯ de una CARPETA (Revision B, PASO 121): renombrar y el
 *  borrado con ELECCION — mover sus hilos a Sin carpeta o borrarlo todo. */
const refrescar = (): void => useBarraStore.getState().refrescar()

export async function renombrarCarpeta(id: string, nombre: string): Promise<void> {
  const limpio = nombre.trim()
  if (limpio === '') return
  await elPuerto().renombrarCarpeta(id, limpio)
  refrescar()
}

/** La eleccion que NO pierde nada: sus hilos pasan a Sin carpeta (SET NULL). */
export async function borrarCarpetaMoviendo(id: string, nombre: string): Promise<boolean> {
  if (!confirmador(`¿Borrar la carpeta «${nombre}»? Sus chats pasan a Sin carpeta.`)) return false
  await elPuerto().borrarCarpeta(id, 'mover')
  refrescar()
  return true
}

/** La eleccion a proposito: hilos + mensajes + carpeta, atomico. Si el hilo
 *  activo vivia dentro, la vista queda limpia (no se pinta un muerto). */
export async function borrarCarpetaConTodo(id: string, nombre: string): Promise<boolean> {
  if (!confirmador(`¿Borrar la carpeta «${nombre}» Y TODOS sus chats? No se puede deshacer.`)) return false // prettier-ignore
  const hilos = await elPuerto().hilosPorCarpeta(id)
  await elPuerto().borrarCarpeta(id, 'con-hilos')
  const barra = useBarraStore.getState()
  const activo = useConstruirStore.getState().hiloActivo
  if (hilos.some((h) => h.id === barra.seleccion || h.id === activo?.id)) {
    barra.setSeleccion(null)
    pintarHilo(null, [])
  }
  refrescar()
  return true
}
