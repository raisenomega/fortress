import type { HiloDeChat, ModoDeChat } from '@domain/chat/hilo-de-chat'
import { useConstruirStore } from '../stores/construir-store'
import { autoTitular, tituloDe } from './auto-titulo'
import { elPuerto } from './puerto-de-hilos'

// El puerto vive en `puerto-de-hilos.ts` desde el PASO 121 (techo de lineas);
// se re-exporta para que las costuras existentes no se muevan.
export { elPuerto, _inyectarPuerto, type PuertoDeHilos } from './puerto-de-hilos'

export interface ParDelHilo {
  readonly projectId: string | null
  readonly modo: ModoDeChat
}

const BASE = { agentId: null, mode: 'supervisado', engine: 'claude-code' } as const
const casa = (h: HiloDeChat | null, par: ParDelHilo): h is HiloDeChat =>
  h !== null && h.projectId === par.projectId && h.modo === par.modo

/** El HILO DEL TURNO (121): a quien pertenece la respuesta en vuelo. Cambiar
 *  de hilo con un draft corriendo NO la desvia — medido en rojo antes. */
let hiloDelTurno: string | null = null
/** SOLO tests: olvidar el turno anterior. */
export const _resetTurno = (): void => void (hiloDelTurno = null)

/** PEREZOSO (106), hoy la RED del arranque: desde la Revision A (120) el
 *  nacimiento normal en libre es EAGER desde la barra (nace con su carpeta);
 *  sin activo que case (primera vez, todo borrado), el primer mensaje pare
 *  un hilo SUELTO con su par EXACTO. El texto llega YA tachado. */
export async function escribirUser(par: ParDelHilo, texto: string): Promise<void> {
  const activo = useConstruirStore.getState().hiloActivo
  const hilo = casa(activo, par) ? activo : await elPuerto().createHilo({ ...par, titulo: tituloDe(texto), carpetaId: null }) // prettier-ignore
  if (!casa(activo, par)) useConstruirStore.getState().setHiloActivo(hilo)
  hiloDelTurno = hilo.id
  await autoTitular(hilo, texto) // el eager sale de la cuna ANTES de la fila
  await elPuerto().addToHilo(hilo.id, { ...BASE, role: 'user', content: texto })
}

export async function escribirAssistant(texto: string): Promise<void> {
  const destino = hiloDelTurno ?? useConstruirStore.getState().hiloActivo?.id ?? null
  if (destino === null) return
  await elPuerto().addToHilo(destino, { ...BASE, role: 'assistant', content: texto })
}

/** Las DOS bocas con persistencia: memoria primero, cajon detras (perder la
 *  fila se avisa, no bloquea la UI). Los servicios de envio usan SOLO estas. */
export function pushUserPersistido(par: ParDelHilo, texto: string): void {
  useConstruirStore.getState().push({ role: 'user', text: texto })
  void escribirUser(par, texto).catch((e) => console.error('[hilo] user sin persistir', e))
}

export function finishDraftPersistido(texto: string): void {
  const vista = useConstruirStore.getState()
  // La vista solo se queda el texto si sigue en el hilo del turno; si no, el
  // draft se descarta de la pantalla y el texto viaja igual a SU cajon.
  if (hiloDelTurno === null || vista.hiloActivo?.id === hiloDelTurno) vista.finishDraft(texto)
  else vista.descartarDraft()
  void escribirAssistant(texto).catch((e) => console.error('[hilo] assistant sin persistir', e))
}

// La rehidratacion (y su senal de «saltada») vive en `rehidratar-el-hilo.ts`
// desde el PASO 110: este fichero toco su techo de lineas.
