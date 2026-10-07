import { mkdtempSync, readFileSync, rmSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { DEFENSAS_DEL_TACHADO } from '@domain/repair/innegociables-tachado'

let userData: string
vi.mock('electron', () => ({ app: { getPath: (): string => userData } }))
const { scanLogWriter } = await import('./write-scan-log')

const leer = (scanId: string): string =>
  readFileSync(join(userData, 'scan-logs', `${scanId}.log`), 'utf8')

beforeEach(() => void (userData = mkdtempSync(join(tmpdir(), 'userdata-'))))
afterEach(() => rmSync(userData, { recursive: true, force: true }))

describe('el guard del crudo: lo persistido se re-parsea, o se NOMBRA', () => {
  it('un bloque ilegible de ORIGEN queda nombrado en el fichero, no en silencio', () => {
    scanLogWriter.write('scan-g1', 'parada\n```json\n{"roto": sin cerrar\n```\nfin')

    const guardado = leer('scan-g1')
    expect(guardado.startsWith('[FORTRESS] AVISO')).toBe(true)
    // La evidencia NO se tira: el aviso encabeza, el crudo sigue debajo.
    expect(guardado).toContain('{"roto"')
    expect(guardado).toContain('fin')
  })

  it('candado: un crudo sano va limpio, sin aviso', () => {
    scanLogWriter.write('scan-g2', 'parada\n```json\n{"ok":1}\n```\nfin')
    expect(leer('scan-g2')).not.toContain('[FORTRESS] AVISO')
  })
})

describe('el tachado por campo y su guard estan PROTEGIDOS', () => {
  // La leccion escrita en la propia familia: proteger la regla y dejar suelto a
  // quien la ejecuta no protege nada. Van el tachador, el detector y el writer.
  it.each([
    'src/domain/scan/redactar-transcript.ts',
    'src/domain/scan/bloques-ilegibles.ts',
    'src/infrastructure/scan/write-scan-log.ts'
  ])('%s esta en la familia del tachado', (ruta) => {
    expect(DEFENSAS_DEL_TACHADO).toContain(ruta)
  })
})
