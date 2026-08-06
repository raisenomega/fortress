import { cognitionTemplate, ENV_EXAMPLE_TEMPLATE, GITIGNORE_TEMPLATE } from './governance-templates'

/**
 * Ensambla los 10 archivos a escribir: los 7 borradores aprobados por el agente
 * + los 3 que genera la app por plantilla (COGNITION-LOG gen 0, .gitignore,
 * .env.example). `.gitignore` va PRIMERO en el mapa: el `git add -A` posterior
 * respeta el orden de escritura, asi los docs internos ya estan ignorados.
 */
export function buildGovernanceFiles(
  projectName: string,
  drafts: Record<string, string>
): Record<string, string> {
  return {
    '.gitignore': GITIGNORE_TEMPLATE,
    '.env.example': ENV_EXAMPLE_TEMPLATE,
    'COGNITION-LOG.md': cognitionTemplate(projectName),
    ...drafts
  }
}
