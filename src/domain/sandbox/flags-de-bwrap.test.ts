import { describe, expect, it } from 'vitest'
import { caja, donde } from './caja-fixture'
import { SOCKET_EN_LA_CAJA, flagsDeBwrap } from './flags-de-bwrap'

const flags = (over = {}): readonly string[] => {
  const r = flagsDeBwrap(caja(over))
  if (!r.ok) throw new Error(r.error)
  return r.value
}

describe('los flags de bwrap dan el contrato de ADR-092, ni mas ni menos', () => {
  it('lo aisla TODO y muere con su padre', () => {
    expect(flags().slice(0, 3)).toEqual(['--unshare-all', '--die-with-parent', '--new-session'])
  })

  it('el HOME se TAPA, y el proyecto se monta ENCIMA: el orden es el contrato', () => {
    const f = flags()
    const tapa = donde(f, '--tmpfs', '/home/ana')
    expect(tapa).toBeGreaterThan(-1)
    expect(donde(f, '--bind', '/home/ana/proyectos/tienda')).toBeGreaterThan(tapa)
    expect(donde(f, '--ro-bind', '/home/ana/.nvm/versions/node/v24.18.0')).toBeGreaterThan(tapa)
  })

  it('el HOME nunca se monta, ni en lectura', () => {
    const f = flags()
    expect(donde(f, '--bind', '/home/ana')).toBe(-1)
    expect(donde(f, '--ro-bind', '/home/ana')).toBe(-1)
  })

  it('lo de solo lectura jamas sale en escritura', () => {
    expect(donde(flags(), '--bind', '/home/ana/.nvm/versions/node/v24.18.0')).toBe(-1)
  })

  it('el proyecto y lo declarado de escritura, y NADA mas, se monta en escritura', () => {
    const f = flags({ escritura: ['/home/ana/repo/.git'] })
    const escribibles = f.flatMap((x, i) => (x === '--bind' ? [f[i + 1]] : []))
    expect(escribibles).toEqual(['/home/ana/repo/.git', '/home/ana/proyectos/tienda'])
  })

  it('sin socket no hay red, ni variable que apunte a un proxy', () => {
    const f = flags()
    expect(f).not.toContain('--share-net')
    expect(f.join(' ')).not.toMatch(/PROXY|proxy/)
  })

  it('con socket: entra en SOLO LECTURA a una ruta fija, y el entorno apunta al puente', () => {
    const f = flags({ socketDelProxy: '/run/user/1000/fortress/p.sock' })
    expect(donde(f, '--ro-bind', '/run/user/1000/fortress/p.sock')).toBeGreaterThan(-1)
    expect(f[donde(f, '--ro-bind', '/run/user/1000/fortress/p.sock') + 2]).toBe(SOCKET_EN_LA_CAJA)
    expect(f).not.toContain('--share-net')
    expect(f[donde(f, '--setenv', 'HTTPS_PROXY') + 2]).toBe('http://127.0.0.1:3128')
  })

  it('una ruta con espacios viaja en UN argumento: aqui no hay shell', () => {
    const f = flags({ proyecto: '/media/ana/onn Disk/tienda', cwd: '/media/ana/onn Disk/tienda' })
    expect(donde(f, '--bind', '/media/ana/onn Disk/tienda')).toBeGreaterThan(-1)
  })
})

describe('lo que NO se monta: la anchura del proyecto es la anchura de la caja', () => {
  it.each([
    ['la raiz', '/'],
    ['el HOME entero', '/home/ana'],
    ['un ancestro del HOME', '/home'],
    ['una ruta relativa', 'proyectos/tienda'],
    ['una ruta con NUL', '/home/ana/p\0']
  ])('%s NO es un proyecto: montarlo abriria la caja', (_, proyecto) => {
    expect(flagsDeBwrap(caja({ proyecto, cwd: proyecto })).ok).toBe(false)
  })

  it('el directorio de trabajo tiene que estar DENTRO del proyecto', () => {
    expect(flagsDeBwrap(caja({ cwd: '/home/ana/otro' })).ok).toBe(false)
    expect(flagsDeBwrap(caja({ cwd: '/home/ana/proyectos/tienda/apps/web' })).ok).toBe(true)
  })
})
