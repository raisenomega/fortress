import type { Agent } from './agent'
import { SENTINEL_OMEGA } from './sentinel-omega'

/** Agentes activos al instalar: los seis de la spec + OMEGA, el meta-auditor. */
export const DEFAULT_AGENTS: readonly Agent[] = [
  {
    id: 'security-reviewer',
    iconName: 'shield',
    name: 'Security Reviewer',
    purpose: 'Secrets, inyecciones, auth, headers y rate limiting',
    enabledByDefault: true
  },
  {
    id: 'code-reviewer',
    iconName: 'search',
    name: 'Code Reviewer',
    purpose: 'Bugs, errores no manejados y edge cases',
    enabledByDefault: true
  },
  {
    id: 'refactor-cleaner',
    iconName: 'brush',
    name: 'Refactor Cleaner',
    purpose: 'Codigo muerto, imports sin usar y duplicacion',
    enabledByDefault: true
  },
  {
    id: 'tdd-guide',
    iconName: 'test-tube',
    name: 'TDD Guide',
    purpose: 'Tests que reproducen el bug antes del fix',
    enabledByDefault: true
  },
  {
    id: 'planner',
    iconName: 'hard-hat',
    name: 'Planner',
    purpose: 'Planifica features y evalua impacto antes de tocar',
    enabledByDefault: true
  },
  {
    id: 'cognition',
    iconName: 'brain',
    name: 'Cognition',
    purpose: 'Patrones aprendidos y reflexiones por sesion',
    enabledByDefault: true
  },
  SENTINEL_OMEGA
]
