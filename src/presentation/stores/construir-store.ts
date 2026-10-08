import { create } from 'zustand'
import type { HiloDeChat } from '@domain/chat/hilo-de-chat'

/** Los modos del chat de construir: la flecha del input los ofrece. 'libre'
 *  (PASO 91) conversa sin repo, powers-off — el unico sin proyecto+confianza. */
export type ConstruirMode = 'plan' | 'investigacion' | 'ejecutor' | 'libre'

export interface ConstruirMsg {
  readonly role: 'user' | 'assistant'
  readonly text: string
}

interface ConstruirState {
  readonly messages: readonly ConstruirMsg[]
  readonly input: string
  /** Modo activo con el que envia Enter o el boton de enviar. La flecha lo cambia. */
  readonly mode: ConstruirMode
  /** Ruta del archivo adjunto para que el agente lo lea, o null. */
  readonly attached: string | null
  readonly busy: boolean
  /** Borrador EN VIVO del turno en curso (null = nada corriendo que pintar). */
  readonly draft: string | null
  /** El hilo ACTIVO del multi-chat (B1): entero, con su par (proyecto, modo)
   *  para comparar al escribir. null = perezoso a la espera del primer mensaje. */
  readonly hiloActivo: HiloDeChat | null
  /** Quedo una rehidratacion SALTADA por la guarda del draft (PASO 110). */
  readonly rehidratacionPendiente: boolean
  /** Ultimo plan producido; es lo que Ejecutor construye (elegirlo = aprobarlo). */
  readonly pendingPlan: { readonly intent: string; readonly plan: string } | null
  setInput: (input: string) => void
  setMode: (mode: ConstruirMode) => void
  setAttached: (attached: string | null) => void
  setBusy: (busy: boolean) => void
  push: (msg: ConstruirMsg) => void
  appendDraft: (delta: string) => void
  /** Cierra el turno: el texto autoritativo entra UNA vez y el borrador se va. */
  finishDraft: (text: string) => void
  /** El borrador se va SIN pegarse: el turno pertenece a OTRO hilo (121). */
  descartarDraft: () => void
  setHiloActivo: (hilo: HiloDeChat | null) => void
  setRehidratacionPendiente: (pendiente: boolean) => void
  /** Rehidratacion (B1): reemplaza la memoria entera desde el cajon. */
  replaceMessages: (messages: readonly ConstruirMsg[]) => void
  setPendingPlan: (p: { intent: string; plan: string } | null) => void
}

export const useConstruirStore = create<ConstruirState>((set) => ({
  messages: [],
  input: '',
  mode: 'plan',
  attached: null,
  busy: false,
  draft: null,
  hiloActivo: null,
  rehidratacionPendiente: false,
  pendingPlan: null,
  setInput: (input) => set({ input }),
  setMode: (mode) => set({ mode }),
  setAttached: (attached) => set({ attached }),
  setBusy: (busy) => set({ busy }),
  push: (msg) => set((s) => ({ messages: [...s.messages, msg] })),
  appendDraft: (delta) => set((s) => ({ draft: (s.draft ?? '') + delta })),
  finishDraft: (text) =>
    set((s) => ({ messages: [...s.messages, { role: 'assistant', text }], draft: null })),
  descartarDraft: () => set({ draft: null }),
  setHiloActivo: (hiloActivo) => set({ hiloActivo }),
  setRehidratacionPendiente: (rehidratacionPendiente) => set({ rehidratacionPendiente }),
  replaceMessages: (messages) => set({ messages: [...messages] }),
  setPendingPlan: (pendingPlan) => set({ pendingPlan })
}))
