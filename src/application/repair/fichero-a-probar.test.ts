import { describe, expect, it } from 'vitest'
import { ficheroAProbar } from './fichero-a-probar'
import type { Analysis } from '@domain/repair/analysis'
import type { AppContext } from '../context'
import type { Project } from '@domain/project/project'
import type { Veredicto } from '@domain/repair/veredicto-del-analisis'

const project = { id: 'p1', path: '/repo', name: 'N' } as unknown as Project
const OBSOLETO = { verdict: 'OBSOLETO' } as Veredicto

interface Opts { tocado?: boolean; sha?: string | null; baseFoco?: string | null; nacidos?: readonly string[]; ancla?: string } // prettier-ignore
function ctx(o: Opts = {}): AppContext {
  return {
    headSha: () => o.sha ?? 'base1',
    filesystemProbe: { contenido: () => o.ancla ?? '' },
    fileHistory: {
      tocadoPorElArreglo: () => Promise.resolve(o.tocado ?? false),
      baseDelFoco: () => Promise.resolve(o.baseFoco ?? null),
      ficherosConMarcadorNacido: () => Promise.resolve(o.nacidos ?? [])
    }
  } as unknown as AppContext
}
function an(ancla: string, forma?: 'presente' | 'ausente', file?: string): Analysis {
  const evidencia = forma === undefined ? undefined : { marcador: 'DROP', forma, ...(file ? { file } : {}) }
  return { target: { id: 'f1', file: ancla }, evidencia } as unknown as Analysis
}
const r = (c: AppContext, a: Analysis): Promise<unknown> => ficheroAProbar(c, project, a, OBSOLETO)

describe('ficheroAProbar: la resolucion del cierre (P1 + P2)', () => {
  it('cita tocada por el foco → probar esa cita', async () => {
    expect(await r(ctx({ tocado: true }), an('a.sql', 'presente', 'nueva.sql'))).toEqual({ probar: 'nueva.sql' })
  })

  it('cita AJENA (el fix no la toco) → conservar; la inferencia NO la rescata', async () => {
    expect(await r(ctx({ tocado: false }), an('a.sql', 'presente', 'ajeno.sql'))).toHaveProperty('conservar')
  })

  it('INC-A: cita + baseDelFoco (sin HEAD) + tocado → probar la cita', async () => {
    expect(await r(ctx({ tocado: true, sha: null, baseFoco: 'bf' }), an('a.sql', 'presente', 'n.sql'))).toEqual({ probar: 'n.sql' }) // prettier-ignore
  })

  it('file omitido + marcador EN el ancla → probar el ancla (como hoy)', async () => {
    expect(await r(ctx({ ancla: 'tiene DROP aqui' }), an('a.sql', 'presente'))).toEqual({ probar: 'a.sql' })
  })

  it('P2: file omitido + no en ancla + nacido en UN fichero del foco → probar ese', async () => {
    expect(await r(ctx({ ancla: 'sin marca', nacidos: ['nueva.sql'] }), an('a.sql', 'presente'))).toEqual({ probar: 'nueva.sql' }) // prettier-ignore
  })

  it('P2: file omitido + no nacio en ninguno → conservar (incompleta), NO ancla mudo', async () => {
    expect(await r(ctx({ ancla: 'sin marca', nacidos: [] }), an('a.sql', 'presente'))).toEqual({ conservar: expect.stringContaining('no nacio') }) // prettier-ignore
  })

  it('P2: file omitido + nacio en VARIOS → conservar (ambigua)', async () => {
    expect(await r(ctx({ ancla: 'sin marca', nacidos: ['x.sql', 'y.sql'] }), an('a.sql', 'presente'))).toEqual({ conservar: expect.stringContaining('ambigua') }) // prettier-ignore
  })
})
