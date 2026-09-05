import { afterEach, describe, expect, it } from 'vitest'
import { gitEnv, gitEnvRemoto } from './git-env'

const SESION = ['SSH_AUTH_SOCK', 'GNOME_KEYRING_CONTROL', 'GPG_AGENT_INFO', 'XAUTHORITY']
const previo = { ...process.env }
afterEach(() => {
  for (const k of SESION) delete process.env[k]
  Object.assign(process.env, previo)
})

describe('el entorno de un git LOCAL no lleva la sesion del operador', () => {
  it('las llaves de sesion no bajan, aunque esten en el proceso', () => {
    // Se prueba el COMPORTAMIENTO, no que el fichero mencione buildEnv: el
    // barrido de fuentes no ve si el constructor de entorno recorta de verdad.
    for (const k of SESION) process.env[k] = 'del-operador'

    for (const k of SESION) expect(gitEnv()[k]).toBeUndefined()
  })

  it('pero git sigue viendo lo que necesita: PATH y HOME', () => {
    const env = gitEnv()

    expect(env.PATH).toBe(process.env.PATH)
    expect(env.HOME).toBe(process.env.HOME)
  })

  it('y el prompt de terminal queda apagado: sin el, git se cuelga esperando', () => {
    expect(gitEnv().GIT_TERMINAL_PROMPT).toBe('0')
  })
})

describe('el de RED devuelve el agente ssh, y SOLO ese', () => {
  it('git push se autentica con el agente del operador, a proposito', () => {
    // Cortarlo no seria acotar: seria romper el push contra un remoto por ssh.
    process.env.SSH_AUTH_SOCK = '/tmp/agente'

    expect(gitEnvRemoto().SSH_AUTH_SOCK).toBe('/tmp/agente')
  })

  it('lo demas de la sesion sigue fuera', () => {
    for (const k of SESION) process.env[k] = 'del-operador'
    const env = gitEnvRemoto()

    for (const k of SESION.filter((x) => x !== 'SSH_AUTH_SOCK')) {
      expect({ k, valor: env[k] }).toEqual({ k, valor: undefined })
    }
  })

  it('sin agente en el proceso no se inventa uno', () => {
    delete process.env.SSH_AUTH_SOCK

    expect(gitEnvRemoto().SSH_AUTH_SOCK).toBeUndefined()
  })
})
