import { DRAFTED_DOCS } from './config-docs'
import { cognitionTemplate, ENV_EXAMPLE_TEMPLATE, GITIGNORE_TEMPLATE } from './governance-templates'

/**
 * Ensambla los 10 archivos a escribir: los 3 que genera la app por plantilla
 * (COGNITION-LOG gen 0, .gitignore, .env.example) + SOLO los 7 documentos
 * conocidos de `drafts`. No se hace spread de `drafts`: un nombre arbitrario que
 * el agente hubiera envuelto (p. ej. `../../.bashrc`) NUNCA se escribe. `.gitignore`
 * va primero para que el `git add -A` no incluya los docs internos.
 */
export function buildGovernanceFiles(
  projectName: string,
  drafts: Record<string, string>
): Record<string, string> {
  const files: Record<string, string> = {
    '.gitignore': GITIGNORE_TEMPLATE,
    '.env.example': ENV_EXAMPLE_TEMPLATE,
    'COGNITION-LOG.md': cognitionTemplate(projectName)
  }
  for (const doc of DRAFTED_DOCS) files[doc] = drafts[doc] ?? ''
  return files
}
