/** Lo que se hereda del operador, y nada mas. `CI` se anade aparte. */
const COPIADAS: readonly string[] = ['PATH', 'HOME']

/**
 * Se reenvian SOLO si existen: en esta maquina no estan, pero un proyecto tras
 * un proxy corporativo o con un locale exigente no instalaria sin ellas.
 *
 * `npm_config_*` NO entra en bloque a proposito, por mucho que aparezca: ahi
 * viaja `npm_config__auth`, que son credenciales del registro.
 */
const REENVIADAS: readonly string[] = [
  'TMPDIR',
  'LANG',
  'LC_ALL',
  'HTTP_PROXY',
  'HTTPS_PROXY',
  'NO_PROXY'
]

/**
 * El entorno con el que corren `npm ci` y los scripts del repo AUDITADO.
 *
 * Antes se les pasaba el entorno entero del proceso —52 variables en una sesion
 * de escritorio normal— y eso incluia las llaves de la sesion viva del
 * operador: `SSH_AUTH_SOCK` (autenticarse como el en cualquier host que alcance
 * su agente), `GNOME_KEYRING_CONTROL`, `GPG_AGENT_INFO`, `XAUTHORITY` y
 * `DISPLAY` (leer su pantalla y su teclado), `DBUS_SESSION_BUS_ADDRESS`. Y el
 * `npm ci` del gate ejecuta a proposito los scripts del `package.json` que se
 * esta auditando: `preinstall` y `prepare` corren siempre. Un `preinstall` de
 * prueba leyo `SSH_AUTH_SOCK` sin esfuerzo.
 *
 * LIMITE, que conviene no confundir: esto ACOTA EL ENTORNO, no encierra al
 * proceso. El codigo del repo sigue corriendo con el usuario y ve el disco
 * entero: puede leer `~/.ssh`, `~/.aws` o lo que haya. Lo que cierra es el robo
 * de SESION VIVA, que es lo mas peligroso y lo mas barato de quitar. Contener
 * de verdad exige un sandbox, y eso es otra pieza de otro tamano.
 *
 * `PATH` se copia de la fuente EN LA LLAMADA, nunca se reconstruye: una app
 * lanzada con doble click hereda un PATH sin nvm, y es `augmentPath()` quien lo
 * completa al arrancar mutando `process.env`. Un PATH fijo dejaria al gate sin
 * encontrar `node` en cuanto la maquina no lo tuviera en `/usr/bin`.
 */
export function buildGateEnv(source: NodeJS.ProcessEnv): Record<string, string> {
  const env: Record<string, string> = { CI: 'true' }
  for (const clave of [...COPIADAS, ...REENVIADAS]) {
    const valor = source[clave]
    if (valor !== undefined) env[clave] = valor
  }
  return env
}
