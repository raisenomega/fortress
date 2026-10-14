import { afterAll, describe, expect, it } from 'vitest'
import { spawnSync } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { carpetaDePrueba, limpiarCarpetasDePrueba } from '../carpeta-de-prueba-fixture'
import { trazarApagado } from './traza-apagado'

afterAll(limpiarCarpetasDePrueba)

describe('trazarApagado: la red del apagado (sincrona, sobrevive al kill)', () => {
  it('traza la secuencia con el estado del -wal, en orden', () => {
    const db = join(carpetaDePrueba('.fortress-traza-'), 'fortress.db')
    writeFileSync(`${db}-wal`, 'xx') // un -wal presente (2 bytes)
    trazarApagado(db, 'closeDb:before')
    trazarApagado(db, 'closeDb:after', 'muertos=3')
    const lineas = readFileSync(`${db}.apagado-trace`, 'utf8').trim().split('\n')
    expect(lineas).toHaveLength(2)
    expect(lineas[0]).toContain('closeDb:before')
    expect(lineas[0]).toContain('wal=2B') // la aguja: -wal aun presente
    expect(lineas[1]).toContain('closeDb:after')
    expect(lineas[1]).toContain('muertos=3')
  })

  it('una linea fsync-eada SOBREVIVE a un SIGKILL a media', () => {
    // El hijo escribe+fsync+cierra una linea y luego se cuelga; `spawnSync` lo
    // mata a lo bruto (SIGKILL) a los 400ms. Si el fsync no durara, la linea se
    // perderia: que siga en disco es la prueba de que la red aguanta el apagado.
    const marca = join(carpetaDePrueba('.fortress-traza-'), 'm.trace')
    const codigo =
      `const fs=require('fs');const fd=fs.openSync(${JSON.stringify(marca)},'a');` +
      `fs.writeSync(fd,'VIVA\\n');fs.fsyncSync(fd);fs.closeSync(fd);while(true){}`
    const r = spawnSync('node', ['-e', codigo], { timeout: 400, killSignal: 'SIGKILL' })
    expect(r.signal).toBe('SIGKILL') // de verdad lo mataron a media
    expect(readFileSync(marca, 'utf8')).toContain('VIVA')
  })
})
