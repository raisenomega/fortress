import { afterEach, describe, expect, it } from 'vitest'
import { existsSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { enCaja, olvidarSonda } from './en-caja'
import { corre, escenario } from './fuga-fixture'

/** LA BATERIA DE FUGAS de ADR-092 §6, contra el bwrap REAL de esta maquina. No
 *  hay dobles: un script hostil dentro de la caja intenta salir y se mira el
 *  disco de fuera. */
const e = escenario()
afterEach(olvidarSonda)

describe('la caja de la clase B, contra bwrap de verdad', () => {
  it('no lee al otro cliente, no escribe fuera, si escribe dentro', () => {
    const salida = corre(e, ['fuga.js'])
    expect(salida['vecino']).toBe('NO:ENOENT')
    expect(salida['dentro']).toBe('OK:escrito')
    expect(existsSync(join(e.raiz, 'escrito.txt'))).toBe(false)
    expect(existsSync(join(e.proyecto, 'dentro.txt'))).toBe(true)
  })

  it('el HOME es un tmpfs vacio: solo asoma el camino hasta node, la excepcion firmada', () => {
    // Si node vive en el HOME (nvm), su camino se ve; nada mas: ni .ssh, ni
    // .config, ni .npm. Es la excepcion medida y firmada («salvo la ruta de node»).
    const asoma = (corre(e, ['fuga.js'])['home'] ?? '').replace(/^OK:/, '')
    const nombres = asoma.split(',').filter((x) => x !== '')
    expect(nombres.every((x) => x === '.nvm' || x === '.fnm')).toBe(true)
  })

  it('no hay red: ni resolver un nombre', () => {
    const js =
      "require('dns').lookup('registry.npmjs.org',(e)=>console.log('red='+(e?'NO:'+e.code:'OK')))"
    expect(corre(e, ['-e', js])['red']).toMatch(/^NO:/)
  })

  it('FAIL-CLOSED: sin bwrap en el PATH no hay comando, y dice por que', () => {
    const l = enCaja('node', ['x'], e.proyecto, e.proyecto, '/nonexistent')
    expect(l).toEqual({ ok: false, error: 'sin-caja:falta-bwrap' })
  })

  it('FAIL-CLOSED: un proyecto demasiado ancho no se monta', () => {
    expect(enCaja('node', ['x'], homedir(), homedir()).ok).toBe(false)
  })

  it('el comando va tras `--`: sus argumentos nunca son flags de bwrap', () => {
    const l = enCaja('node', ['--version'], e.proyecto, e.proyecto)
    if (!l.ok) throw new Error(l.error)
    const args = l.value.args
    expect(args.slice(args.indexOf('--'))).toEqual(['--', 'node', '--version'])
  })
})
