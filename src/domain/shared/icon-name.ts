/**
 * Nombres semanticos de icono. El dominio nombra la idea ("escudo"), no el
 * componente: quien la dibuja es presentacion. Asi la capa pura sigue sin
 * saber que existe React ni Lucide.
 */
export const ICON_NAMES = [
  'shield',
  'shield-off',
  'search',
  'brush',
  'test-tube',
  'hard-hat',
  'brain',
  'wrench',
  'sparkles',
  'package',
  'rocket',
  'play',
  'check-circle',
  'alert-triangle',
  'x-circle',
  'circle',
  'eye',
  'zap',
  'folder-open',
  'git-branch',
  'file-text',
  'settings',
  'message-square',
  'terminal',
  'castle',
  'users',
  'code'
] as const

export type IconName = (typeof ICON_NAMES)[number]
