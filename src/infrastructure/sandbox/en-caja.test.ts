import { afterAll, afterEach, describe, expect, it } from 'vitest'
import { existsSync } from 'node:fs'
import { homedir } from 'node:os'
import { createServer } from 'node:net'
import { join } from 'node:path'
import { limpiarCarpetasDePrueba } from '../carpeta-de-prueba-fixture'
import { enCaja } from './en-caja'
import { olvidarSonda } from './sonda-de-bwrap'
import { corre, escenario } from './fuga-fixture'

/** LA BATERIA DE FUGAS de ADR-092 §6, contra el bwrap REAL de esta maquina. No
 *  hay dobles: un script hostil dentro de la caja intenta salir y se mira el
 *  disco de fuera. */
const e = escenario()
afterEach(olvidarSonda)
afterAll(limpiarCarpetasDePrueba)

describe('la caja de la clase B, contra bwrap de verdad', () => {
  it('no lee al otro cliente, no escribe fuera, si escribe dentro', async () => {
    const salida = await corre(e, ['fuga.js'])
    expect(salida['vecino']).toBe('NO:ENOENT')
    expect(salida['dentro']).toBe('OK:escrito')
    expect(existsSync(join(e.raiz, 'escrito.txt'))).toBe(false)
    expect(existsSync(join(e.proyecto, 'dentro.txt'))).toBe(true)
  })

  it('el HOME es un tmpfs vacio: solo asoman las excepciones firmadas', async () => {
    // Si node vive en el HOME (nvm), su camino se ve; y desde ADR-108, las dos
    // cachés de cabeceras publicas. Nada mas: ni .ssh, ni .config, ni .npm.
    const FIRMADAS = ['.nvm', '.fnm', '.cache', '.electron-gyp']
    const asoma = ((await corre(e, ['fuga.js']))['home'] ?? '').replace(/^OK:/, '')
    const nombres = asoma.split(',').filter((x) => x !== '')

    expect(nombres.filter((x) => !FIRMADAS.includes(x))).toEqual([])
  })

  /**
   * ADR-108, las dos casillas que la firma exige contra bwrap DE VERDAD.
   *
   * El tmpfs crea el `~/.cache` intermedio VACIO y solo `node-gyp` se monta
   * encima: el resto de la cache del operador —`.npm` con su token incluido— no
   * asoma. Y escribir en las cabeceras se NIEGA: con montaje escribible, un
   * proceso de la caja de un CLIENTE envenenaria la cache que despues compila
   * el modulo nativo de FORTRESS.
   */
  it('de ~/.cache solo asoma node-gyp, y las cabeceras no se dejan escribir', async () => {
    const salida = await corre(e, ['fuga.js'])
    const cache = (salida['cache'] ?? '').replace(/^OK:/, '').split(',').filter((x) => x !== '') // prettier-ignore

    expect(cache).toEqual(['node-gyp'])
    expect(salida['cabeceras']).toBe('NO:EROFS')
  })

  it('no hay red: un servidor en el loopback de FUERA no se alcanza desde dentro', async () => {
    // Que un nombre no resuelva no prueba nada: dentro no hay resolv.conf y
    // fallaria igual con la red abierta (el mutante `--share-net` sobrevivia).
    const servidor = createServer((s) => s.end('FUERA'))
    await new Promise<void>((r) => servidor.listen(0, '127.0.0.1', r))
    const puerto = (servidor.address() as { port: number }).port
    const js = `require('net').connect(${puerto},'127.0.0.1').on('connect',()=>console.log('red=OK')).on('error',(x)=>console.log('red=NO:'+x.code))` // prettier-ignore
    try {
      expect((await corre(e, ['-e', js]))['red']).toMatch(/^NO:/)
    } finally {
      servidor.close()
    }
  })
})

describe('la caja falla cerrada, y sus flags no se negocian', () => {
  it('FAIL-CLOSED: sin bwrap en el PATH no hay comando, y dice por que', () => {
    const l = enCaja('node', ['x'], e.proyecto, e.proyecto, '/nonexistent')
    expect(l).toEqual({ ok: false, error: 'sin-caja:falta-bwrap' })
  })

  it('FAIL-CLOSED: un proyecto demasiado ancho no se monta', () => {
    expect(enCaja('node', ['x'], homedir(), homedir()).ok).toBe(false)
  })

  it('una ruta de escritura declarada fuera del proyecto se monta rw: ahi cae el worktree', () => {
    const l = enCaja('git', ['worktree', 'add', e.vecino], e.proyecto, e.proyecto, undefined, [e.vecino]) // prettier-ignore
    if (!l.ok) throw new Error(l.error)
    const i = l.value.args.indexOf('--bind')
    expect(l.value.args.slice(i, i + 3)).toEqual(['--bind', e.vecino, e.vecino])
  })

  it('el comando va tras `--`: sus argumentos nunca son flags de bwrap', () => {
    const l = enCaja('node', ['--version'], e.proyecto, e.proyecto)
    if (!l.ok) throw new Error(l.error)
    const args = l.value.args
    expect(args.slice(args.indexOf('--'))).toEqual(['--', 'node', '--version'])
  })
})
