/**
 * El entorno con el que arranca el hijo del CLI. Sale de `claude-cli` porque
 * son dos trabajos distintos —con que argumentos se invoca, y con que entorno
 * corre— y porque su prueba ya se llamaba `build-env.test.ts` desde antes de
 * que este archivo existiera: la frontera estaba nombrada y sin dibujar.
 */

/** Llaves de la SESION VIVA del operador; el porque de cada una, en `repair/gate-env.ts`. */
// prettier-ignore
const SESION_VIVA: readonly string[] = ['SSH_AUTH_SOCK', 'GNOME_KEYRING_CONTROL', 'GPG_AGENT_INFO', 'XAUTHORITY', 'DISPLAY', 'DBUS_SESSION_BUS_ADDRESS', 'LD_LIBRARY_PATH', 'npm_config__auth']

/**
 * Entorno del hijo, menos esas llaves: el CLI corre con cwd en el repo AUDITADO
 * y su allowlist le deja lanzar sus `npm run` y sus MCP, nietos que heredan
 * ESTE entorno. Recorte y no lista blanca como el gate: alli el hijo ES el repo
 * auditado; aqui es el CLI, y lo que el y sus MCP necesitan no lo enumero nadie.
 * Con key configurada se le pasa; sin ella `claude` usa las suyas (login OAuth).
 * LIMITE: la key SI viaja —es la eleccion de facturacion— y la ven los nietos.
 */
/**
 * Privacidad del hijo (ADR-088, arco 1). Dos caminos por los que el codigo del
 * CLIENTE podria salir sin que FORTRESS lo decida:
 * - `/feedback` —y `/bug` y `/share`, que van por el mismo sitio— envia la
 *   conversacion CON el codigo, y eso se retiene 5 anos aunque el operador tenga
 *   el entrenamiento apagado: el opt-out no cubre el feedback;
 * - el trafico no esencial (encuestas, metricas, informes de error).
 *
 * Las fija FORTRESS, no el operador: se auditan repos ajenos, y ese camino no lo
 * abre el producto. Van aqui porque `buildEnv` es el paso UNICO de todos los
 * spawns del CLI, los del Terminal y los del Motor.
 */
const PRIVACIDAD = {
  CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC: '1',
  DISABLE_FEEDBACK_COMMAND: '1'
}

export function buildEnv(apiKey: string | null): NodeJS.ProcessEnv {
  const env: NodeJS.ProcessEnv = { ...process.env, ...PRIVACIDAD }
  for (const clave of SESION_VIVA) delete env[clave]
  return apiKey ? { ...env, ANTHROPIC_API_KEY: apiKey } : env
}
