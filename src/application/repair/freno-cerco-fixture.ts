import type { ConfigState } from '@domain/repair/auto-merge-config'
import { DEFAULT_POLICY } from '@domain/repair/auto-merge-policy'
import { hallazgo } from './plan-repair-fixture'

/** El cerco real de FORTRESS: solo LOW y con `ipc/**` excluido. */
export const CERCO: ConfigState = {
  kind: 'valid',
  policy: { ...DEFAULT_POLICY, enabled: true, severities: ['LOW'], blacklist: ['src/infrastructure/ipc/**'] } // prettier-ignore
}
/** mailbd: declara `.fortress/config` pero sin bloque autoMerge. */
export const SIN_CERCO: ConfigState = { kind: 'invalid', reason: 'falta el bloque autoMerge' }

export const LIBRE = hallazgo('f-libre', 'src/infrastructure/claude-code/run-accumulator.ts')
export const VETADO = hallazgo('f-vetado', 'src/infrastructure/ipc/graph-action-handlers.ts')
export const MEDIO = { ...hallazgo('f-medio', 'src/application/a.ts'), severity: 'MEDIUM' as const }
