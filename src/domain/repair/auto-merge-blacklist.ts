/** Ver `criterio-innegociable.ts`: que entra en esta lista, y por que. */
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
  // Lo que ENTRA al sistema y no es fuente de confianza. `project-path` decide
  // que ruta puede ser raiz de proyecto y `target-path` es la otra mitad de esa
  // misma guarda —la que rechaza el ".."—: proteger una sola repetiria el error
  // que hizo falta esta lista. `graph-mcp` decide que herramientas recibe el
  // agente, y `private-host` es el filtro anti-SSRF, con dos HIGH a su espalda.
  'src/domain/project/project-path.ts',
  'src/domain/newproject/target-path.ts',
  'src/domain/connectors/graph-mcp.ts',
  'src/domain/posture/private-host.ts',
  // Las URLs tambien entran de fuera. `target-url` es la mitad llamadora de
  // `private-host` —valida el destino del escaneo y le pregunta a el—, y
  // `connector-url` exige https a un MCP que viajara con las credenciales del
  // operador. `create-folder` decide que se le cuenta al renderer de una carpeta.
  'src/domain/posture/target-url.ts',
  'src/domain/connectors/connector-url.ts',
  'src/infrastructure/newproject/create-folder.ts',
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
