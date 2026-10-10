import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import { readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { buildAllowedTools, buildDisallowedTools } from '../claude-code/build-allowed-tools'
import { leerCtoKit, leerKitDe } from './leer-cto-kit'

/** PASO 130: el lector del cto-kit — tolerante como su hermano audit-kit. */

describe('el lector del cto-kit: tolera TODO fallo, nada tumba al CTO', () => {
  it('AUSENCIA CONFESADA: sin Electron y sin carpeta, [] y ni un throw', () => {
    expect(leerCtoKit()).toEqual([]) // sin app viva: el kit simplemente no esta
    expect(leerKitDe('/no/existe/cto-kit')).toEqual([])
  })

  it('lista las .md sembradas, en orden, y la ILEGIBLE cae sola', () => {
    const carpeta = mkdtempSync(join(tmpdir(), 'cto-kit-'))
    writeFileSync(join(carpeta, 'B-VERDAD.md'), 'verdad de datos')
    writeFileSync(join(carpeta, 'A-SEGURIDAD.md'), 'marco de seguridad')
    writeFileSync(join(carpeta, 'notas.txt'), 'no es plantilla')
    mkdirSync(join(carpeta, 'ROTA.md')) // un directorio .md: readFile revienta
    expect(leerKitDe(carpeta)).toEqual([
      { nombre: 'A-SEGURIDAD', texto: 'marco de seguridad' },
      { nombre: 'B-VERDAD', texto: 'verdad de datos' }
    ])
  })
})

describe('las capas y el candado, pineados (molde de la casa)', () => {
  const fuente = (r: string): string => readFileSync(r, 'utf8')

  it('DOMINIO RECIBE TEXTO: bloque-cto-kit no toca disco; el I/O vive aqui', () => {
    const dominio = fuente('src/domain/build/bloque-cto-kit.ts')
    expect(dominio).not.toContain('readFileSync')
    expect(dominio).not.toContain("from 'fs'")
    expect(dominio).not.toContain('electron')
    // Sello B.1 ENSANCHO el pin: el kit sigue entrando igual y la rebanada
    // entra POR EL MISMO bloque — la composicion sigue siendo del dominio.
    const corrida = fuente('src/infrastructure/build/run-cto.ts')
    expect(corrida).toContain('bloqueCtoKit([...leerCtoKit(), ...marcos])')
  })

  it('NADIE crea la carpeta por codigo: nace a mano, como el audit-kit', () => {
    const lector = fuente('src/infrastructure/build/leer-cto-kit.ts')
    expect(lector).not.toContain('mkdir')
    expect(lector).not.toContain('writeFile')
    // El unico mkdir de la corrida es el del CUARTO vacio (chat-cto), no el kit.
    const corrida = fuente('src/infrastructure/build/run-cto.ts')
    expect(corrida.match(/mkdirSync\(/g)).toHaveLength(1)
    expect(corrida).toContain("'chat-cto'")
  })

  it("CANDADO INTACTO: allow EXACTAMENTE ['WebSearch'], WebFetch denegado (PASO 142)", () => {
    expect(buildAllowedTools('libre', false, [])).toEqual(['WebSearch'])
    expect(buildDisallowedTools('libre', true)).toEqual(['Bash', 'WebFetch'])
    expect(fuente('src/infrastructure/build/run-cto.ts')).toContain("permissionMode: 'libre'")
  })
})
