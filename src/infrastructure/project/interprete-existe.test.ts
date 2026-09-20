import { existsSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { interpreteExiste } from './interprete-existe'

/** Un PATH de mentira con UN binario dentro, para no depender de la maquina. */
function conBinario(nombre: string): string {
  const bin = mkdtempSync(join(tmpdir(), 'fortress-path-'))
  writeFileSync(join(bin, nombre), '#!/bin/sh\n', { mode: 0o755 })
  return bin
}

const CANARIO = join(tmpdir(), 'fortress-canario-inyeccion')

afterEach(() => {
  expect(existsSync(CANARIO)).toBe(false)
})

describe('interpreteExiste imita a `command -v`', () => {
  const bin = conBinario('python3')

  it('encuentra el que esta en el PATH', () => {
    expect(interpreteExiste('python3', bin)).toBe(true)
  })

  it('y NO encuentra el que no esta — el caso de `raisen-nucleo`', () => {
    expect(interpreteExiste('python', bin)).toBe(false)
  })

  it('un binario sin permiso de ejecucion NO cuenta: el hook tampoco arrancaria', () => {
    const sordo = mkdtempSync(join(tmpdir(), 'fortress-path-'))
    writeFileSync(join(sordo, 'python'), '#!/bin/sh\n', { mode: 0o644 })

    expect(interpreteExiste('python', sordo)).toBe(false)
  })

  it('recorre TODAS las carpetas del PATH, no solo la primera', () => {
    expect(interpreteExiste('python3', `/no/existe:${bin}`)).toBe(true)
  })

  it('PATH vacio: nada existe, y no revienta', () => {
    expect(interpreteExiste('python3', '')).toBe(false)
    expect(interpreteExiste('', bin)).toBe(false)
  })
})

/**
 * LA PARTE DE SEGURIDAD. El comando sale del `.claude/settings.json` de un
 * proyecto auditado —codigo ajeno—. Si esto pasara por `sh -c`, bastaria con
 * escribir el settings para que ABRIR el proyecto ejecutara lo que quisiera.
 */
describe('y NO ejecuta nada: no hay shell que interpretar', () => {
  it('un nombre con `;` no dispara el segundo comando', () => {
    expect(interpreteExiste(`x; touch ${CANARIO}`, '/usr/bin:/bin')).toBe(false)
  })

  it('ni la sustitucion de comandos, ni las comillas invertidas', () => {
    expect(interpreteExiste(`$(touch ${CANARIO})`, '/usr/bin:/bin')).toBe(false)
    expect(interpreteExiste(`\`touch ${CANARIO}\``, '/usr/bin:/bin')).toBe(false)
  })

  it('un nombre con NUL se rechaza antes de tocar el disco', () => {
    expect(interpreteExiste(`python${String.fromCharCode(0)}3`, '/usr/bin')).toBe(false)
  })
})
