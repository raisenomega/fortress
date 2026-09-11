import { mkdtempSync, rmSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { SIN_DECLARACION } from '@domain/scan/declaracion-de-modulos'
import { MODULOS_AUDITORIA } from '@domain/scan/modulo-auditoria'
import { MODULOS_SIEMPRE } from '@domain/scan/modulos-siempre'
import { esDeCarpeta } from '@domain/scan/parada'
import { REPARTO_VACIO } from '@domain/scan/manifiesto'
import { medirProyecto } from './medir-proyecto'
import { repoCon } from './repo-fixture'

let repo: string

beforeEach(() => {
  repo = repoCon({ 'src/domain/scanner.ts': 'x', 'src/app/run.ts': 'x', 'README.md': 'x' })
})

afterEach(() => {
  rmSync(repo, { recursive: true, force: true })
})

describe('medirProyecto junta las tres lecturas', () => {
  it('del repo real salen las paradas y su total', async () => {
    const { paradas, ficherosTotal } = await medirProyecto(repo, SIN_DECLARACION)

    expect(paradas.filter(esDeCarpeta).map((p) => p.carpeta)).toEqual(['src/app', 'src/domain'])
    expect(ficherosTotal).toBe(2)
  })

  it('los doce modulos salen con veredicto, tambien en un repo sin senales', async () => {
    const { modulosAplicables, modulosDescartados, modulosSinConstancia } = await medirProyecto(
      repo,
      SIN_DECLARACION
    )

    expect(modulosAplicables).toEqual(MODULOS_SIEMPRE)
    expect(modulosAplicables.length + modulosDescartados.length + modulosSinConstancia.length).toBe(
      MODULOS_AUDITORIA.length
    )
  })

  it('la declaracion del operador viaja hasta el manifiesto', async () => {
    const { modulosAplicables } = await medirProyecto(repo, { M8: true })

    // Sobre el nucleo, que aplica siempre y no depende de nadie.
    // En el orden del vocabulario, que es el que fija `MODULOS_AUDITORIA`.
    expect(modulosAplicables).toEqual(['M1', 'M6', 'M8', 'M10'])
  })

  it('una carpeta sin repo git da manifiesto vacio de paradas, no un fallo', async () => {
    const vacio = mkdtempSync(join(tmpdir(), 'sin-git-'))
    try {
      expect(await medirProyecto(vacio, SIN_DECLARACION)).toMatchObject(REPARTO_VACIO)
    } finally {
      rmSync(vacio, { recursive: true, force: true })
    }
  })
})
