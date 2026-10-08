import type { Carpeta } from '@domain/chat/carpeta-de-chat'
import type { HiloDeChat } from '@domain/chat/hilo-de-chat'
import { useBarraStore } from '../stores/barra-store'
import { useConstruirStore } from '../stores/construir-store'
import { elPuerto } from './hilo-activo'
import { pintarHilo } from './rehidratar-el-hilo'

/**
 * Las acciones de la barra del Chat (PASO 116). LA REGLA DEL MANDO del
 * contrato: clic en un hilo = ESE hilo manda — fija la seleccion VIVA, que
 * gana sobre la rehidratacion-por-par hasta que el operador la cambie.
 */
export async function elegirHilo(hilo: HiloDeChat): Promise<void> {
  const mensajes = await elPuerto().listByHilo(hilo.id)
  const barra = useBarraStore.getState()
  barra.setSeleccion(hilo.id)
  barra.setVistaDeCarpeta(null) // elegir un hilo SIEMPRE vuelve al chat
  useConstruirStore.getState().setMode('libre') // el clic te deja EN libre
  pintarHilo(hilo, mensajes)
}

/** Pantalla limpia: el proximo mensaje nace hilo nuevo SUELTO (perezoso B1). */
export function nuevoHiloSuelto(): void {
  const barra = useBarraStore.getState()
  barra.setSeleccion(null)
  barra.setCarpetaActiva(null) // Fase 3: el de arriba SIEMPRE nace suelto
  barra.setVistaDeCarpeta(null)
  useConstruirStore.getState().setMode('libre')
  pintarHilo(null, [])
}

// Los flujos de carpeta (crear-y-entrar, abrir, nuevo-dentro, buscar) viven
// en `carpetas-de-la-barra.ts` desde la Fase 3: este fichero toco su techo.

/** Borra el hilo (cascade de B0); si era el elegido, la vista queda limpia. */
export async function borrarHiloYLimpiar(hiloId: string): Promise<void> {
  await elPuerto().borrarHilo(hiloId)
  if (useBarraStore.getState().seleccion === hiloId) nuevoHiloSuelto()
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
