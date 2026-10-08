import type { Carpeta } from '@domain/chat/carpeta-de-chat'
import type { HiloDeChat } from '@domain/chat/hilo-de-chat'
import { useBarraStore } from '../stores/barra-store'
import { useConstruirStore } from '../stores/construir-store'
import { elPuerto } from './hilo-activo'
import { limpiarAlSalir } from './limpiar-vacios'
import { pintarHilo } from './rehidratar-el-hilo'

/**
 * Las acciones de la barra del Chat (PASO 116). LA REGLA DEL MANDO del
 * contrato: clic en un hilo = ESE hilo manda — fija la seleccion VIVA, que
 * gana sobre la rehidratacion-por-par hasta que el operador la cambie.
 * Todo gesto de SALIDA limpia el vacio que deja atras (Revision A).
 */
export async function elegirHilo(hilo: HiloDeChat): Promise<void> {
  if (useConstruirStore.getState().hiloActivo?.id !== hilo.id) await limpiarAlSalir()
  const mensajes = await elPuerto().listByHilo(hilo.id)
  useBarraStore.getState().setSeleccion(hilo.id)
  useConstruirStore.getState().setMode('libre') // el clic te deja EN libre
  pintarHilo(hilo, mensajes)
}

/** EAGER (Revision A): el hilo nace DE VERDAD al instante — fila real,
 *  activo, seleccionado y pantalla limpia. carpetaId null = suelto. */
export async function nuevoHiloEager(carpetaId: string | null): Promise<HiloDeChat> {
  await limpiarAlSalir()
  const hilo = await elPuerto().createHilo({ projectId: null, titulo: 'Nuevo chat', modo: 'libre', carpetaId }) // prettier-ignore
  useBarraStore.getState().setSeleccion(hilo.id)
  useConstruirStore.getState().setMode('libre')
  pintarHilo(hilo, [])
  return hilo
}

/** «+ Nuevo chat» de arriba: SIEMPRE suelto, por construccion. */
export const nuevoHiloSuelto = (): Promise<HiloDeChat> => nuevoHiloEager(null)

/** Borra el hilo (cascade de B0); si era el elegido, la vista queda limpia. */
export async function borrarHiloYLimpiar(hiloId: string): Promise<void> {
  await elPuerto().borrarHilo(hiloId)
  if (useBarraStore.getState().seleccion === hiloId) {
    useBarraStore.getState().setSeleccion(null)
    useConstruirStore.getState().setMode('libre')
    pintarHilo(null, [])
  }
}

export interface ListasDeLaBarra {
  readonly carpetas: readonly Carpeta[]
  readonly sueltos: readonly HiloDeChat[]
}

/** Lo que la barra pinta: SOLO el plano de libre (carpetas + sueltos). */
export async function cargarListas(): Promise<ListasDeLaBarra> {
  const [carpetas, sueltos] = await Promise.all([
    elPuerto().listarCarpetas(),
    elPuerto().listarSueltos()
  ])
  return { carpetas, sueltos }
}
