import { afterAll, afterEach, describe, expect, it } from 'vitest'
import { writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { carpetaDePrueba, limpiarCarpetasDePrueba } from '../carpeta-de-prueba-fixture'
import { conSandbox } from './con-sandbox'
import { olvidarSonda } from './sonda-de-bwrap'

const proyecto = (...manifiestos: string[]): string => {
  const dir = carpetaDePrueba('.fortress-cli-test-')
  for (const m of manifiestos) writeFileSync(join(dir, m), '{}')
  return dir
}
const ARGS = ['-p', 'hola', '--output-format', 'json']
const settingsDe = (args: readonly string[]): { sandbox: Record<string, unknown> } =>
  JSON.parse(args[args.indexOf('--settings') + 1] ?? '{}') as { sandbox: Record<string, unknown> }

afterEach(olvidarSonda)
afterAll(limpiarCarpetasDePrueba)

describe('los args de un claude -p con la caja puesta', () => {
  it('anade --settings al final y no toca los args que ya habia', () => {
    const r = conSandbox(ARGS, proyecto('package.json'))
    if (!r.ok) throw new Error(r.error)
    expect(r.value.slice(0, ARGS.length)).toEqual(ARGS)
    expect(r.value[ARGS.length]).toBe('--settings')
  })

  it('la red sale de los manifiestos del proyecto: package.json abre npm y nada mas', () => {
    const r = conSandbox(ARGS, proyecto('package.json', 'README.md'))
    if (!r.ok) throw new Error(r.error)
    expect(settingsDe(r.value).sandbox['network']).toEqual({
      allowedDomains: ['registry.npmjs.org']
    })
  })

  it('sin manifiesto, sin red: lista vacia', () => {
    const r = conSandbox(ARGS, proyecto('README.md'))
    if (!r.ok) throw new Error(r.error)
    expect(settingsDe(r.value).sandbox['network']).toEqual({ allowedDomains: [] })
  })

  it('la lectura se cierra al proyecto y a node; el HOME y los discos, negados', () => {
    const dir = proyecto('package.json')
    const r = conSandbox(ARGS, dir)
    if (!r.ok) throw new Error(r.error)
    const fs = settingsDe(r.value).sandbox['filesystem'] as {
      denyRead: string[]
      allowRead: string[]
    }
    expect(fs.denyRead).toEqual(['~/', '/media', '/mnt', '/run/media'])
    expect(fs.allowRead[0]).toBe(dir)
    expect(fs.allowRead).toHaveLength(2)
  })

  it('FAIL-CLOSED: sin bwrap no hay args, y dice por que', () => {
    expect(conSandbox(ARGS, proyecto('package.json'), '/nonexistent')).toEqual({ ok: false, error: 'sin-caja:falta-bwrap' }) // prettier-ignore
  })

  it('un proyecto que no se puede leer no abre la red por si acaso', () => {
    const r = conSandbox(ARGS, join(homedir(), '.fortress-cli-test-no-existe'))
    if (!r.ok) throw new Error(r.error)
    expect(settingsDe(r.value).sandbox['network']).toEqual({ allowedDomains: [] })
  })
})
