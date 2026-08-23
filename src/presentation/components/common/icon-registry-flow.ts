import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  GitBranch,
  GitMerge,
  RefreshCw,
  RotateCcw,
  type LucideIcon
} from 'lucide-react'
import type { IconName } from '@domain/shared/icon-name'

type FlowIconName =
  | 'chevron-up'
  | 'chevron-down'
  | 'chevron-right'
  | 'chevron-left'
  | 'git-branch'
  | 'git-merge'
  | 'refresh-cw'
  | 'rotate-ccw'

/** Glifos de flujo y navegacion, separados del registro base por el limite de 75. */
export const FLOW_ICONS: Pick<Record<IconName, LucideIcon>, FlowIconName> = {
  'chevron-up': ChevronUp,
  'chevron-down': ChevronDown,
  'chevron-right': ChevronRight,
  'chevron-left': ChevronLeft,
  'git-branch': GitBranch,
  'git-merge': GitMerge,
  'refresh-cw': RefreshCw,
  'rotate-ccw': RotateCcw
}
