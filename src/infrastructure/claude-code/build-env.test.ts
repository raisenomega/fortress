import { afterEach, describe, expect, it } from 'vitest'
import { buildEnv } from './claude-cli'

/** Lo que una sesion de escritorio real le ofrecia al CLI, y el a sus nietos. */
const SESION: NodeJS.ProcessEnv = {
  SSH_AUTH_SOCK: '/run/user/1000/keyring/ssh',
  GNOME_KEYRING_CONTROL: '/run/user/1000/keyring',
  GPG_AGENT_INFO: '/run/user/1000/gnupg/S.gpg-agent',
  XAUTHORITY: '/home/u/.Xauthority',
  DISPLAY: ':0',
  DBUS_SESSION_BUS_ADDRESS: 'unix:path=/run/user/1000/bus',
  LD_LIBRARY_PATH: '/tmp/.mount_fortress/usr/lib',
  npm_config__auth: 'credencial-del-registro'
}

afterEach(() => {
  for (const clave of [...Object.keys(SESION), 'FCC_MARCA']) delete process.env[clave]
})

describe('buildEnv', () => {
  it('pasa la key configurada en FORTRESS', () => {
    expect(buildEnv('sk-ant-xyz').ANTHROPIC_API_KEY).toBe('sk-ant-xyz')
  })

  it('sin key, deja que claude use sus propias credenciales', () => {
    expect(buildEnv(null).ANTHROPIC_API_KEY).toBe(process.env.ANTHROPIC_API_KEY)
  })

  it('el CLI sigue viendo lo que necesita: PATH, HOME y el resto del entorno', () => {
    process.env.FCC_MARCA = 'presente'
    const env = buildEnv('sk-ant-xyz')
    expect(env.PATH).toBe(process.env.PATH)
    expect(env.HOME).toBe(process.env.HOME)
    // Los MCP de terceros leen su token del entorno (ADR-043): no se recorta.
    expect(env.FCC_MARCA).toBe('presente')
  })
})

describe('buildEnv — lo que el CLI ya no puede pasar a los nietos', () => {
  it('las llaves de la sesion viva del operador no bajan', () => {
    Object.assign(process.env, SESION)
    const env = buildEnv('sk-ant-xyz')
    for (const clave of Object.keys(SESION)) expect(env[clave]).toBeUndefined()
    expect(JSON.stringify(env)).not.toContain('credencial-del-registro')
  })

  it('el recorte es cerrado y enumerable: nada mas se queda fuera', () => {
    Object.assign(process.env, SESION)
    const env = buildEnv(null)
    const fuera = Object.keys(process.env).filter((clave) => !(clave in env))
    expect(fuera.sort()).toEqual(Object.keys(SESION).sort())
  })

  it('recorta una copia: el entorno del proceso principal queda intacto', () => {
    Object.assign(process.env, SESION)
    buildEnv('sk-ant-xyz')
    expect(process.env.SSH_AUTH_SOCK).toBe(SESION.SSH_AUTH_SOCK)
  })
})
