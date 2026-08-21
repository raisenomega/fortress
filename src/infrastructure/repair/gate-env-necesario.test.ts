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

describe('buildGateEnv — lo que el gate SI necesita para funcionar', () => {
  it('PATH y HOME se copian de la fuente: npm necesita encontrar node', () => {
    const env = buildGateEnv(SESION)
    expect(env.PATH).toBe(SESION.PATH)
    expect(env.HOME).toBe('/home/u')
  })

  it('el PATH sale de la fuente en la llamada, no de una lista fija', () => {
    // augmentPath() anade nvm al arrancar: si el PATH fuese fijo, el gate no
    // encontraria node en una maquina que no lo tenga en /usr/bin.
    const otra = buildGateEnv({ PATH: '/otro/sitio/bin', HOME: '/home/u' })
    expect(otra.PATH).toBe('/otro/sitio/bin')
  })

  it('CI viaja siempre: sin ella el runner vigila ficheros y cuelga el gate', () => {
    expect(buildGateEnv({}).CI).toBe('true')
  })

  it('proxy, locale y tmpdir se reenvian SOLO si existen', () => {
    const con = buildGateEnv({ ...SESION, HTTPS_PROXY: 'http://proxy:3128', LANG: 'es_ES.UTF-8' })
    expect(con.HTTPS_PROXY).toBe('http://proxy:3128')
    expect(con.LANG).toBe('es_ES.UTF-8')

    const sin = buildGateEnv(SESION)
    expect('HTTPS_PROXY' in sin).toBe(false)
    expect('TMPDIR' in sin).toBe(false)
  })

  it('el entorno resultante es pequeno y enumerable', () => {
    expect(Object.keys(buildGateEnv(SESION)).sort()).toEqual(['CI', 'HOME', 'PATH'])
  })
})
