import {
  ChevronDown,
  ChevronRight,
  ChevronUp,
  GitBranch,
  GitMerge,
  type LucideIcon
} from 'lucide-react'
import type { IconName } from '@domain/shared/icon-name'

type FlowIconName = 'chevron-up' | 'chevron-down' | 'chevron-right' | 'git-branch' | 'git-merge'

/** Glifos de flujo y navegacion, separados del registro base por el limite de 75. */
export const FLOW_ICONS: Pick<Record<IconName, LucideIcon>, FlowIconName> = {
  'chevron-up': ChevronUp,
  'chevron-down': ChevronDown,
  'chevron-right': ChevronRight,
  'git-branch': GitBranch,
  'git-merge': GitMerge
}
