import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

let userData: string
/** La carpeta que hay que limpiar: `userData` puede acabar apuntando a otro sitio. */
let base: string

vi.mock('electron', () => ({ app: { getPath: (): string => userData } }))

const { scanLogWriter } = await import('./write-scan-log')

const SECRETO = 'sk-ant-api03-0123456789abcdefghijklmnop'
const TEXTO = `Miré el fichero y encontré esto:\nexport ANTHROPIC_API_KEY=${SECRETO}\ny sigo.`

const leer = (scanId: string): string =>
  readFileSync(join(userData, 'scan-logs', `${scanId}.log`), 'utf8')

beforeEach(() => {
  base = mkdtempSync(join(tmpdir(), 'userdata-'))
  userData = base
})

afterEach(() => {
  rmSync(base, { recursive: true, force: true })
})

describe('la transcripcion queda en disco, tachada', () => {
  it('escribe en userData/scan-logs/{scanId}.log', () => {
    scanLogWriter.write('scan-1', 'un informe cualquiera')

    expect(leer('scan-1')).toBe('un informe cualquiera')
  })

  it('el secreto NO llega al fichero: se tacha ENTERO al guardar', () => {
    scanLogWriter.write('scan-2', TEXTO)

    const guardado = leer('scan-2')
    expect(guardado).not.toContain(SECRETO)
    // Lo demas sobrevive: tachar no es borrar la transcripcion.
    expect(guardado).toContain('Miré el fichero')
    expect(guardado).toContain('y sigo.')
  })

  it('un secreto dentro de un campo se tacha sin comerse lo de al lado (re-parsea)', () => {
    scanLogWriter.write('scan-5', 'Analisis.\n\n```json\n{"findings":[{"severity":"LOW","title":"pide token: abc123","file":"a.ts","line":3}]}\n```') // prettier-ignore

    const guardado = leer('scan-5')
    const bloque = /```json\s*([\s\S]*?)```/.exec(guardado)?.[1] ?? '(sin bloque)'
    expect((JSON.parse(bloque) as { findings: { line: number }[] }).findings[0].line).toBe(3)
    expect(guardado).not.toContain('abc123')
  })

  it('NO escribe en el repo auditado: es prosa de FORTRESS, no memoria del proyecto', () => {
    scanLogWriter.write('scan-3', 'x')

    // El unico destino es userData. Si algun dia esto cayera en el repo del
    // cliente podria colarse en un commit suyo.
    expect(leer('scan-3')).toBe('x')
  })
})

describe('mejor esfuerzo: el disco no puede tumbar un escaneo ya guardado', () => {
  it('un destino imposible no lanza', () => {
    // Un FICHERO donde deberia ir la carpeta: `mkdir` da ENOTDIR al instante y
    // sin depender del sistema. El escaneo ya esta guardado; perder su
    // transcripcion no puede tirarlo.
    const fichero = join(base, 'soy-un-fichero')
    writeFileSync(fichero, 'x')
    userData = fichero

    expect(() => scanLogWriter.write('scan-4', 'x')).not.toThrow()
  })
})
