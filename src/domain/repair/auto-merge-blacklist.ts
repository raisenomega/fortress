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
 *
 * El criterio para entrar: si cambiar ese archivo DEBILITA una defensa, entra.
 * La lista se quedo corta dos veces por el mismo motivo — la proteccion seguia
 * al NOMBRE del archivo y no a la responsabilidad, asi que al partir un modulo
 * la mitad que decidia se quedaba fuera. Al mover codigo que gobierna autonomia,
 * mirar aqui antes de cerrar la pieza.
 */
export const AUTONOMY_RULES_FILES: readonly string[] = [
  // Que puede hacer el agente, y donde.
  'src/domain/settings/permission-mode.ts',
  'src/domain/settings/protected-areas.ts',
  'src/domain/settings/safe-commands.ts',
  'src/domain/settings/modo-efectivo.ts',
  'src/domain/loop/loop-gate.ts',
  'src/infrastructure/run-guard.ts',
  // Sobre QUE proyectos se puede actuar, y con que entorno.
  'src/domain/repair/confianza.ts',
  'src/application/repair/gate-guards.ts',
  'src/infrastructure/repair/gate-env.ts',
  'src/infrastructure/system/self-project.ts',
  // El perimetro del generador: hasta donde llega un fix.
  'src/domain/repair/scope-check.ts',
  // Quien deja pasar una integracion. `auto-merge-policy` declara la politica;
  // `evaluation` es quien la COMPRUEBA y `config` quien la lee y fusiona esta
  // misma lista: proteger solo el primero dejaba fuera a los dos que deciden.
  'src/domain/repair/auto-merge-policy.ts',
  'src/domain/repair/auto-merge-evaluation.ts',
  'src/domain/repair/auto-merge-config.ts',
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
