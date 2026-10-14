import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { estaProbado } from '@domain/repair/evidencia-obsolescencia'
import { ficheroAProbar } from '@application/repair/fichero-a-probar'
import { limpiarCarpetasDePrueba } from '../carpeta-de-prueba-fixture'
import { olvidarImports } from './grafo-de-imports'
import { createRutaDelControl } from './ruta-del-control-git'
import {
  MARCADOR,
  MARCADOR_HUERFANO,
  MARCADOR_LLAMADOR,
  repoDeRuta
} from './ruta-del-control-fixture'
import type { AppContext } from '@application/context'
import type { Analysis } from '@domain/repair/analysis'
import type { Project } from '@domain/project/project'
import type { Veredicto } from '@domain/repair/veredicto-del-analisis'

let repo: string
const ruta = createRutaDelControl()
beforeAll(() => void (repo = repoDeRuta()))
afterAll(() => {
  limpiarCarpetasDePrueba()
  olvidarImports()
})

const OBSOLETO = { verdict: 'OBSOLETO' } as Veredicto
const leer = (_p: string, f: string): string | null => {
  try {
    return readFileSync(join(repo, f), 'utf8')
  } catch {
    return null
  }
}
const ctx = (): AppContext =>
  ({ filesystemProbe: { contenido: leer }, rutaDelControl: ruta }) as unknown as AppContext
const an = (marcador: string, file?: string): Analysis =>
  ({ target: { id: 'f1', file: 'src/ancla.ts' }, evidencia: { marcador, forma: 'presente', ...(file ? { file } : {}) } }) as unknown as Analysis // prettier-ignore
const probar = (a: Analysis): Promise<unknown> =>
  ficheroAProbar(ctx(), { path: repo } as Project, a, OBSOLETO)

describe('RutaDelControl: control en ruta por conectividad (cobayas reales)', () => {
  it('controlesEnHead: control+decoy presentes y atribuidos; el .test.ts queda fuera', async () => {
    expect([...(await ruta.controlesEnHead(repo, MARCADOR))].sort()).toEqual([
      'src/control.ts',
      'src/decoy.ts'
    ])
  })
  it('enRuta: control conectado (2 saltos), decoy NO, llamador por el reverso', () => {
    expect(ruta.enRuta(repo, 'src/ancla.ts', 'src/control.ts')).toBe(true)
    expect(ruta.enRuta(repo, 'src/ancla.ts', 'src/decoy.ts')).toBe(false)
    expect(ruta.enRuta(repo, 'src/ancla.ts', 'src/llamador.ts')).toBe(true)
  })
  it('cobaya 2: file omitido + decoy con el MISMO marcador → unico en ruta = control', async () => {
    expect(await probar(an(MARCADOR))).toEqual({ probar: 'src/control.ts' })
    expect(
      estaProbado({ marcador: MARCADOR, forma: 'presente' }, leer('', 'src/control.ts')).probado
    ).toBe(true)
  })
  it('cobaya 1: el control IMPORTA al ancla → probar el llamador', async () => {
    expect(await probar(an(MARCADOR_LLAMADOR))).toEqual({ probar: 'src/llamador.ts' })
  })
  it('DIENTE: presente+atribuido pero conectado a nada → conservar (no cierra)', async () => {
    expect(await probar(an(MARCADOR_HUERFANO))).toHaveProperty('conservar')
  })
})
