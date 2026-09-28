import { DEFENSAS_INNEGOCIABLES } from './innegociables-defensa'
import { DEFENSAS_DEL_PROMPT } from './innegociables-prompt'
import { DEFENSAS_DE_LA_FUSION } from './innegociables-fusion'
import { DEFENSAS_DE_SECRETOS } from './innegociables-secretos'
import { DEFENSAS_DEL_TACHADO } from './innegociables-tachado'

/** Ver `criterio-innegociable.ts`. Familias aparte: `-defensa`, `-disco`, `-secretos`, `-prompt`, `-tachado`. */
export const AUTONOMY_RULES_FILES: readonly string[] = [
  ...DEFENSAS_INNEGOCIABLES,
  ...DEFENSAS_DE_SECRETOS,
  ...DEFENSAS_DEL_TACHADO,
  ...DEFENSAS_DEL_PROMPT,
  ...DEFENSAS_DE_LA_FUSION,
  // Que puede hacer el agente, y donde.
  'src/domain/settings/permission-mode.ts',
  'src/domain/settings/safe-commands.ts',
  'src/domain/settings/modo-efectivo.ts',
  'src/domain/loop/loop-gate.ts',
  'src/infrastructure/run-guard.ts',
  // Sobre QUE proyectos se puede actuar, y con que entorno.
  'src/domain/repair/confianza.ts',
  'src/application/repair/gate-guards.ts',
  'src/infrastructure/repair/gate-env.ts',
  // La otra mitad: `gate-env` arma el entorno del gate; `claude-cli` el de todo agente.
  'src/infrastructure/claude-code/claude-cli.ts',
  'src/infrastructure/system/self-project.ts',
  // El perimetro del generador: hasta donde llega un fix.
  'src/domain/repair/scope-check.ts',
  // Lo que ENTRA y no es fuente de confianza. `project-path` y `target-path` son
  // las dos mitades de la misma guarda —proteger una sola repetiria el error que
  // hizo falta esta lista—; `graph-mcp` decide que herramientas recibe el agente.
  'src/domain/project/project-path.ts',
  'src/domain/newproject/target-path.ts',
  'src/domain/connectors/graph-mcp.ts',
  'src/infrastructure/claude-code/build-allowed-tools.ts',
  // Las URLs tambien entran de fuera. `connector-url` exige https a un MCP que
  // viajara con las credenciales del operador; `safe-url` decide que enlaces se
  // abren fuera de la app; y `create-folder`, que se le cuenta al renderer.
  'src/domain/connectors/connector-url.ts',
  'src/domain/shared/safe-url.ts',
  'src/infrastructure/newproject/create-folder.ts',
  // POR CARPETA: posture ENTERA es la defensa anti-SSRF. Enumerar sus mitades
  // fallo cuatro veces —la lista solo cubre lo que alguien recuerda escribir— y
  // un glob cubre tambien lo que aun no existe: `ipv4-formas`, nacido el 05 de
  // septiembre, quedo protegido sin que nadie se acordara. Ese es el precio
  // correcto para este subsistema.
  'src/domain/posture/**',
  'src/infrastructure/posture/**',
  // Quien deja pasar una integracion. `auto-merge-policy` declara la politica;
  // `evaluation` es quien la COMPRUEBA y `config` quien la lee y fusiona esta
  // misma lista: proteger solo el primero dejaba fuera a los dos que deciden.
  'src/domain/repair/auto-merge-policy.ts',
  'src/domain/repair/auto-merge-evaluation.ts',
  'src/domain/repair/auto-merge-config.ts',
  'src/domain/repair/auto-merge-blacklist.ts',
  'src/domain/shared/path-glob.ts',
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
