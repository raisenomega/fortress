import { buildEnv } from '../claude-code/build-env'

/** Sin terminal no hay quien teclee una contrasena: sin esto git se cuelga
 *  esperando un prompt que nadie ve. */
const GIT = { GIT_TERMINAL_PROMPT: '0' } as const

/**
 * El entorno de un `git` LOCAL: commit, init, log, status, checkout.
 *
 * Todos corren con `cwd` en el repo AUDITADO y varios ejecutan sus HOOKS —un
 * `pre-commit` es codigo ajeno—, y hasta ahora heredaban `process.env` entero:
 * el agente ssh del operador, su keyring, su GPG, su D-Bus. Cinco ficheros
 * repetian la misma linea `{ ...process.env, GIT_TERMINAL_PROMPT: '0' }`, y
 * arreglar uno dejaba los otros cuatro igual — que es exactamente lo que paso:
 * el merge se acoto ayer y estos siguieron abiertos.
 *
 * No lleva `LC_ALL`: quien CLASIFICA la salida de git la fija por su cuenta,
 * porque ahi el idioma cambia el significado. Aqui la salida se le enseña al
 * operador, y en su idioma se lee mejor.
 */
export function gitEnv(): NodeJS.ProcessEnv {
  return { ...buildEnv(null), ...GIT }
}

/**
 * El de un `git` que sale a la RED. `git push` tiene que autenticarse, y con un
 * remoto por ssh eso es el agente del operador: cortarlo no es acotar, es
 * romper el push. Se le devuelve SOLO esa llave y ninguna otra.
 *
 * Es la misma eleccion declarada que la API key en `buildEnv`: publicar al
 * remoto se hace CON la identidad del operador, a proposito. Lo que no viaja es
 * todo lo demas de su sesion.
 */
export function gitEnvRemoto(): NodeJS.ProcessEnv {
  const agente = process.env.SSH_AUTH_SOCK
  return agente === undefined ? gitEnv() : { ...gitEnv(), SSH_AUTH_SOCK: agente }
}
