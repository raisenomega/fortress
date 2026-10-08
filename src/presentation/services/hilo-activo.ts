import type { HiloDeChat, ModoDeChat } from '@domain/chat/hilo-de-chat'
import { useConstruirStore } from '../stores/construir-store'
import { elPuerto } from './puerto-de-hilos'

// El puerto vive en `puerto-de-hilos.ts` desde el PASO 121 (techo de lineas);
// se re-exporta para que las costuras existentes no se muevan.
export { elPuerto, _inyectarPuerto, type PuertoDeHilos } from './puerto-de-hilos'

export interface ParDelHilo {
  readonly projectId: string | null
  readonly modo: ModoDeChat
}

const titulo = (intent: string): string => intent.trim().slice(0, 40) || 'Nuevo chat'
const BASE = { agentId: null, mode: 'supervisado', engine: 'claude-code' } as const
const casa = (h: HiloDeChat | null, par: ParDelHilo): h is HiloDeChat =>
  h !== null && h.projectId === par.projectId && h.modo === par.modo

/** PEREZOSO (106), hoy la RED del arranque: desde la Revision A (120) el
 *  nacimiento normal en libre es EAGER desde la barra (nace con su carpeta);
 *  sin activo que case (primera vez, todo borrado), el primer mensaje pare
 *  un hilo SUELTO con su par EXACTO. El texto llega YA tachado. */
export async function escribirUser(par: ParDelHilo, texto: string): Promise<void> {
  const activo = useConstruirStore.getState().hiloActivo
  const hilo = casa(activo, par) ? activo : await elPuerto().createHilo({ ...par, titulo: titulo(texto), carpetaId: null }) // prettier-ignore
  if (!casa(activo, par)) useConstruirStore.getState().setHiloActivo(hilo)
  await elPuerto().addToHilo(hilo.id, { ...BASE, role: 'user', content: texto })
}

export async function escribirAssistant(texto: string): Promise<void> {
  const activo = useConstruirStore.getState().hiloActivo
  if (activo === null) return
  await elPuerto().addToHilo(activo.id, { ...BASE, role: 'assistant', content: texto })
}

/** Las DOS bocas con persistencia: memoria primero, cajon detras (perder la
 *  fila se avisa, no bloquea la UI). Los servicios de envio usan SOLO estas. */
export function pushUserPersistido(par: ParDelHilo, texto: string): void {
  useConstruirStore.getState().push({ role: 'user', text: texto })
  void escribirUser(par, texto).catch((e) => console.error('[hilo] user sin persistir', e))
}

export function finishDraftPersistido(texto: string): void {
  useConstruirStore.getState().finishDraft(texto)
  void escribirAssistant(texto).catch((e) => console.error('[hilo] assistant sin persistir', e))
}

// La rehidratacion (y su senal de «saltada») vive en `rehidratar-el-hilo.ts`
// desde el PASO 110: este fichero toco su techo de lineas.
