/**
 * Archivos que implementan la politica de autonomia del propio proyecto.
 *
 * Principio 21: un sistema no aplica por su cuenta un cambio a las reglas que
 * gobiernan lo que puede aplicar por su cuenta. El motor SI puede proponer
 * cambios sobre estos archivos —son codigo como cualquier otro y pueden tener
 * defectos—; lo que no puede es integrarlos sin que un humano los mire.
 *
 * Esta lista NO es configurable. Un proyecto puede anadir entradas a su
 * blacklist, nunca quitar estas: si la proteccion fuese declarativa seria
 * eliminable por declaracion, y bastaria una propuesta que la borrase para
 * abrir todo lo demas.
 */
export const AUTONOMY_RULES_FILES: readonly string[] = [
  'src/domain/settings/permission-mode.ts',
  'src/domain/settings/protected-areas.ts',
  'src/domain/settings/safe-commands.ts',
  'src/domain/loop/loop-gate.ts',
  'src/infrastructure/run-guard.ts',
  'src/domain/repair/auto-merge-policy.ts',
  'src/domain/repair/auto-merge-blacklist.ts',
  'src/domain/shared/path-glob.ts',
  // Auto-cobertura: el archivo que declara la blacklist se cubre a si mismo.
  '.fortress/config'
]

/** Areas sensibles habituales. Un proyecto las sustituye declarando las suyas. */
export const COMMON_SENSITIVE_AREAS: readonly string[] = [
  'src/domain/auth/**',
  'src/domain/pago/**',
  '**/migrations/**',
  '**/.env*',
  '**/secrets/**',
  '.github/workflows/**'
]

/** Lo que se aplica a un proyecto que no ha declarado nada. */
export const DEFAULT_BLACKLIST: readonly string[] = [
  ...AUTONOMY_RULES_FILES,
  ...COMMON_SENSITIVE_AREAS
]
