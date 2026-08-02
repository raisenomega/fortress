/** Atajos del chat: mapean a los comandos documentados en CLAUDE.md. */
export interface QuickAction {
  readonly id: string
  readonly icon: string
  readonly label: string
  /** Texto que se envia tal cual al chat. */
  readonly prompt: string
}

export const QUICK_ACTIONS: readonly QuickAction[] = [
  {
    id: 'security',
    icon: '🛡️',
    label: 'Revisa la seguridad',
    prompt: 'Revisa la seguridad de este proyecto'
  },
  {
    id: 'clean',
    icon: '🧹',
    label: 'Limpia el codigo',
    prompt: 'Limpia el codigo de este proyecto'
  },
  {
    id: 'bugs',
    icon: '🔍',
    label: 'Busca bugs',
    prompt: 'Busca bugs en este proyecto'
  },
  {
    id: 'tests',
    icon: '🧪',
    label: 'Escribe tests',
    prompt: 'Escribe tests para este proyecto'
  },
  {
    id: 'production',
    icon: '🚀',
    label: 'Listo para produccion?',
    prompt: 'Esta listo para produccion?'
  }
]
