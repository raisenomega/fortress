import type { Carpeta } from '@domain/chat/carpeta-de-chat'
import type { HiloDeChat } from '@domain/chat/hilo-de-chat'
import { useBarraStore } from '../stores/barra-store'
import { useConstruirStore } from '../stores/construir-store'
import { elPuerto } from './hilo-activo'
import { pintarHilo } from './rehidratar-el-hilo'

/** Los flujos de CARPETA de la Fase 3 (hermano de barra-del-chat por el
 *  techo de lineas): crear-y-entrar, abrir, nuevo-dentro y la busqueda. */

/** «Nuevo chat en ESTA carpeta»: el proximo mensaje nace DENTRO. */
export function nuevoHiloEnCarpeta(carpetaId: string): void {
  const barra = useBarraStore.getState()
  barra.setSeleccion(null)
  barra.setCarpetaActiva(carpetaId)
  barra.setVistaDeCarpeta(null)
  useConstruirStore.getState().setMode('libre')
  pintarHilo(null, [])
}

/** Crear carpeta y ENTRAR en su pagina (flujo B del contrato). */
export async function crearCarpetaYEntrar(nombre: string): Promise<Carpeta> {
  const carpeta = await elPuerto().crearCarpeta(nombre)
  await abrirCarpeta(carpeta.id)
  return carpeta
}

/** Clic en la fila de una carpeta: su pagina, con la carpeta como activa. */
export async function abrirCarpeta(carpetaId: string): Promise<void> {
  const barra = useBarraStore.getState()
  barra.setCarpetaActiva(carpetaId)
  barra.setVistaDeCarpeta(carpetaId)
}

export const hilosDeCarpeta = (carpetaId: string): Promise<readonly HiloDeChat[]> =>
  elPuerto().hilosPorCarpeta(carpetaId)

/** Busqueda por titulo, SOLO el plano de libre (carpetas y sueltos). */
export async function buscarHilos(texto: string): Promise<readonly HiloDeChat[]> {
  const aguja = texto.trim().toLowerCase()
  if (aguja === '') return []
  return (await elPuerto().listHilos(null)).filter((h) => h.titulo.toLowerCase().includes(aguja))
}
