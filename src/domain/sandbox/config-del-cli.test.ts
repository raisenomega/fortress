import { describe, expect, it } from 'vitest'
import { argsDelSandbox, configDelSandbox, type CajaDelCli } from './config-del-cli'

const caja = (over: Partial<CajaDelCli> = {}): CajaDelCli => ({
  proyecto: '/home/ana/proyectos/tienda',
  soloLectura: ['/home/ana/.nvm/versions/node/v24.18.0'],
  registros: ['registry.npmjs.org'],
  ...over
})

const config = (over = {}): unknown => {
  const r = configDelSandbox(caja(over))
  if (!r.ok) throw new Error(r.error)
  return r.value
}

describe('la config del sandbox del CLI es la que se MIDIO el 2026-09-21', () => {
  it('entera, campo a campo: asi contuvo un `npm run` pre-aprobado', () => {
    expect(config()).toEqual({
      sandbox: {
        enabled: true,
        failIfUnavailable: true,
        allowUnsandboxedCommands: false,
        autoAllowBashIfSandboxed: false,
        filesystem: {
          denyRead: ['~/', '/media', '/mnt', '/run/media'],
          allowRead: ['/home/ana/proyectos/tienda', '/home/ana/.nvm/versions/node/v24.18.0']
        },
        network: { allowedDomains: ['registry.npmjs.org'] }
      }
    })
  })

  it('sin registros la red queda cerrada: lista vacia, no ausente', () => {
    expect(config({ registros: [] })).toMatchObject({
      sandbox: { network: { allowedDomains: [] } }
    })
  })

  it.each(['evil.com', 'registry.npmjs.org.evil.com', '*.npmjs.org', ''])(
    '«%s» no entra en la red: solo cabe lo que esta en la tabla cerrada',
    (host) => expect(configDelSandbox(caja({ registros: [host] })).ok).toBe(false)
  )

  it.each(['proyectos/tienda', '/home/ana/../../etc', '/home/ana/p\0'])(
    'la ruta «%s» no se le pasa al CLI',
    (ruta) => {
      expect(configDelSandbox(caja({ proyecto: ruta })).ok).toBe(false)
      expect(configDelSandbox(caja({ soloLectura: [ruta] })).ok).toBe(false)
    }
  )

  it('viaja como `--settings` y UN solo argumento: ni shell, ni fichero en el repo del cliente', () => {
    const r = argsDelSandbox(caja())
    if (!r.ok) throw new Error(r.error)
    expect(r.value).toHaveLength(2)
    expect(r.value[0]).toBe('--settings')
    expect(JSON.parse(r.value[1] ?? '')).toEqual(config())
  })
})
