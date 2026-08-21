import { describe, expect, it } from 'vitest'
import { buildGateEnv } from './gate-env'

/** Lo que una sesion de escritorio real le ofrecia al repo auditado. */
const SESION: NodeJS.ProcessEnv = {
  PATH: '/home/u/.nvm/versions/node/v24/bin:/usr/bin:/bin',
  HOME: '/home/u',
  SSH_AUTH_SOCK: '/run/user/1000/keyring/ssh',
  GNOME_KEYRING_CONTROL: '/run/user/1000/keyring',
  GPG_AGENT_INFO: '/run/user/1000/gnupg/S.gpg-agent',
  XAUTHORITY: '/home/u/.Xauthority',
  DISPLAY: ':0',
  DBUS_SESSION_BUS_ADDRESS: 'unix:path=/run/user/1000/bus',
  LD_LIBRARY_PATH: '/tmp/.mount_fortress/usr/lib',
  ANTHROPIC_API_KEY: 'sk-no-deberia-viajar',
  npm_config__auth: 'credencial-del-registro'
}

describe('buildGateEnv — el repo auditado no hereda la sesion del operador', () => {
  it('las llaves de la sesion viva NO viajan', () => {
    const env = buildGateEnv(SESION)
    for (const clave of [
      'SSH_AUTH_SOCK',
      'GNOME_KEYRING_CONTROL',
      'GPG_AGENT_INFO',
      'XAUTHORITY',
      'DISPLAY',
      'DBUS_SESSION_BUS_ADDRESS',
      'LD_LIBRARY_PATH'
    ]) {
      // prettier-ignore
      expect(env[clave]).toBeUndefined()
    }
  })

  it('ni la API key ni las credenciales de registro viajan', () => {
    const env = buildGateEnv(SESION)
    expect(env.ANTHROPIC_API_KEY).toBeUndefined()
    expect(env.npm_config__auth).toBeUndefined()
    expect(JSON.stringify(env)).not.toContain('sk-no-deberia-viajar')
  })
})
