import { describe, expect, it } from 'vitest'
import { ficheroAProbar } from './fichero-a-probar'
import type { Analysis } from '@domain/repair/analysis'
import type { AppContext } from '../context'
import type { Project } from '@domain/project/project'
import type { Veredicto } from '@domain/repair/veredicto-del-analisis'

const project = { id: 'p1', path: '/repo', name: 'N' } as unknown as Project
const OBSOLETO = { verdict: 'OBSOLETO' } as Veredicto

interface Opts { ancla?: string; controles?: readonly string[]; enRuta?: (f: string) => boolean } // prettier-ignore
function ctx(o: Opts = {}): AppContext {
  return {
    filesystemProbe: { contenido: () => o.ancla ?? '' },
    rutaDelControl: {
      controlesEnHead: () => Promise.resolve(o.controles ?? []),
      enRuta: (_p: string, _a: string, f: string) => (o.enRuta ? o.enRuta(f) : true)
    }
  } as unknown as AppContext
}
function an(ancla: string, forma?: 'presente' | 'ausente', file?: string): Analysis {
  const evidencia =
    forma === undefined ? undefined : { marcador: 'DROP', forma, ...(file ? { file } : {}) }
  return { target: { id: 'f1', file: ancla }, evidencia } as unknown as Analysis
}
const r = (c: AppContext, a: Analysis): Promise<unknown> => ficheroAProbar(c, project, a, OBSOLETO)

describe('ficheroAProbar: cierre por CONECTIVIDAD a la ruta (P1 + P2)', () => {
  it('forma ausente → probar el ancla (el defecto vivia ahi), sin tocar la ruta', async () => {
    expect(await r(ctx(), an('a.ts', 'ausente'))).toEqual({ probar: 'a.ts' })
  })

  it('P1: cita que es control real Y en ruta → probar esa cita', async () => {
    expect(await r(ctx({ controles: ['nueva.ts'] }), an('a.ts', 'presente', 'nueva.ts'))).toEqual({
      probar: 'nueva.ts'
    })
  })

  it('P1: cita que NO es un control presente+atribuido → conservar (ajeno)', async () => {
    expect(await r(ctx({ controles: [] }), an('a.ts', 'presente', 'ajeno.ts'))).toHaveProperty(
      'conservar'
    )
  })

  it('P1: cita que es control pero NO en ruta → conservar (ajeno)', async () => {
    expect(await r(ctx({ controles: ['x.ts'], enRuta: () => false }), an('a.ts', 'presente', 'x.ts'))).toHaveProperty('conservar') // prettier-ignore
  })

  it('file omitido + marcador EN el ancla → probar el ancla (como hoy)', async () => {
    expect(await r(ctx({ ancla: 'tiene DROP aqui' }), an('a.ts', 'presente'))).toEqual({
      probar: 'a.ts'
    })
  })

  it('P2: file omitido + UN control en ruta → probar ese', async () => {
    expect(await r(ctx({ controles: ['nueva.ts'] }), an('a.ts', 'presente'))).toEqual({
      probar: 'nueva.ts'
    })
  })

  it('DIENTE: dos casan el texto pero solo UNO esta en ruta → ese (decoy excluido)', async () => {
    const c = ctx({ controles: ['real.ts', 'decoy.ts'], enRuta: (f) => f === 'real.ts' })
    expect(await r(c, an('a.ts', 'presente'))).toEqual({ probar: 'real.ts' })
  })

  it('P2: ningun control en ruta → conservar (no esta en la ruta), NO ancla mudo', async () => {
    expect(await r(ctx({ controles: ['x.ts'], enRuta: () => false }), an('a.ts', 'presente'))).toEqual({ conservar: expect.stringContaining('no esta en la ruta') }) // prettier-ignore
  })

  it('P2: varios en ruta → conservar (ambigua)', async () => {
    expect(await r(ctx({ controles: ['x.ts', 'y.ts'] }), an('a.ts', 'presente'))).toEqual({ conservar: expect.stringContaining('ambigua') }) // prettier-ignore
  })
})
