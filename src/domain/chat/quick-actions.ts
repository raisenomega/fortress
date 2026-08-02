import type { IconName } from '../shared/icon-name'

/** Atajos del chat: mapean a los comandos documentados en CLAUDE.md. */
export interface QuickAction {
  readonly id: string
  readonly iconName: IconName
  readonly label: string
  /** Texto que se envia tal cual al chat. */
  readonly prompt: string
}

export const QUICK_ACTIONS: readonly QuickAction[] = [
  {
    id: 'security',
    iconName: 'shield',
    label: 'Revisa la seguridad',
    prompt: 'Revisa la seguridad de este proyecto'
  },
  {
    id: 'clean',
    iconName: 'brush',
    label: 'Limpia el codigo',
    prompt: 'Limpia el codigo de este proyecto'
  },
  {
    id: 'bugs',
    iconName: 'search',
    label: 'Busca bugs',
    prompt: 'Busca bugs en este proyecto'
  },
  {
    id: 'tests',
    iconName: 'test-tube',
    label: 'Escribe tests',
    prompt: 'Escribe tests para este proyecto'
  },
  {
    id: 'production',
    iconName: 'rocket',
    label: 'Listo para produccion?',
    prompt: 'Esta listo para produccion?'
  }
]
