import {
  AlertTriangle,
  Brain,
  Brush,
  Castle,
  CheckCircle,
  Circle,
  Eye,
  FileText,
  FolderOpen,
  GitBranch,
  HardHat,
  MessageSquare,
  Package,
  Play,
  Rocket,
  Search,
  Settings,
  Shield,
  ShieldOff,
  Sparkles,
  TestTube,
  Wrench,
  XCircle,
  Zap,
  type LucideIcon
} from 'lucide-react'
import type { IconName } from '@domain/shared/icon-name'

const REGISTRY: Record<IconName, LucideIcon> = {
  shield: Shield,
  'shield-off': ShieldOff,
  search: Search,
  brush: Brush,
  'test-tube': TestTube,
  'hard-hat': HardHat,
  brain: Brain,
  wrench: Wrench,
  sparkles: Sparkles,
  package: Package,
  rocket: Rocket,
  play: Play,
  'check-circle': CheckCircle,
  'alert-triangle': AlertTriangle,
  'x-circle': XCircle,
  circle: Circle,
  eye: Eye,
  zap: Zap,
  'folder-open': FolderOpen,
  'git-branch': GitBranch,
  'file-text': FileText,
  settings: Settings,
  'message-square': MessageSquare,
  castle: Castle
}

interface IconProps {
  readonly name: IconName
  readonly size?: number
  readonly className?: string
}

/** Los SVG de Lucide heredan currentColor, asi que respetan el tema solos. */
export function Icon({ name, size = 14, className }: IconProps): React.JSX.Element {
  const Glyph = REGISTRY[name]
  return <Glyph size={size} className={className} strokeWidth={2} aria-hidden />
}
