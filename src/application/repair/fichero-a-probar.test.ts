import { describe, expect, it } from 'vitest'
import { ficheroAProbar } from './fichero-a-probar'
import type { Analysis } from '@domain/repair/analysis'
import type { AppContext } from '../context'
import type { Project } from '@domain/project/project'
import type { Veredicto } from '@domain/repair/veredicto-del-analisis'

const project = { id: 'p1', path: '/repo', name: 'N' } as unknown as Project
const OBSOLETO = { verdict: 'OBSOLETO' } as Veredicto
const REAL = { verdict: 'REAL' } as Veredicto

/** `tocado` = lo que la puerta git responde; `sha` = HEAD; `baseFoco` = la base
 *  del trabajo enfocado (INC-A), null = caer a HEAD. */
function ctx(tocado: boolean, sha: string | null = 'base1', baseFoco: string | null = null): AppContext {
  return {
    headSha: () => sha,
    fileHistory: {
      tocadoPorElArreglo: () => Promise.resolve(tocado),
      baseDelFoco: () => Promise.resolve(baseFoco)
    }
  } as unknown as AppContext
}

function analisis(ancla: string, file?: string): Analysis {
  const evidencia = file === undefined ? undefined : { marcador: 'm', forma: 'presente' as const, file }
  return { target: { id: 'f1', file: ancla }, evidencia } as unknown as Analysis
}

describe('ficheroAProbar: la puerta touched-by-fix (ADR-087 enmienda)', () => {
  it('(c) sin file citado → el ancla (conducta de hoy)', async () => {
    expect(await ficheroAProbar(ctx(false), project, analisis('ancla.sql'), OBSOLETO)).toBe('ancla.sql')
  })

  it('(d) cita === ancla → el ancla (no pasa por la puerta)', async () => {
    expect(await ficheroAProbar(ctx(false), project, analisis('ancla.sql', 'ancla.sql'), OBSOLETO)).toBe('ancla.sql') // prettier-ignore
  })

  it('(a) cita distinta que el fix SI toco → la cita', async () => {
    expect(await ficheroAProbar(ctx(true), project, analisis('ancla.sql', 'nueva.sql'), OBSOLETO)).toBe('nueva.sql') // prettier-ignore
  })

  it('(b) CLAVE: cita distinta AJENA (el fix no la toco) → null, no cierra', async () => {
    expect(await ficheroAProbar(ctx(false), project, analisis('ancla.sql', 'ajeno.sql'), OBSOLETO)).toBeNull()
  })

  it('veredicto no OBSOLETO → el ancla (la puerta solo abre para OBSOLETO)', async () => {
    expect(await ficheroAProbar(ctx(true), project, analisis('ancla.sql', 'nueva.sql'), REAL)).toBe('ancla.sql')
  })

  it('sin HEAD (repo sin git) + cita distinta → null (conserva, ADR-065)', async () => {
    expect(await ficheroAProbar(ctx(true, null), project, analisis('ancla.sql', 'nueva.sql'), OBSOLETO)).toBeNull() // prettier-ignore
  })

  it('INC-A: usa baseDelFoco cuando existe (precede a HEAD) — la ventana es del foco', async () => {
    // HEAD null (el turno de verify no veria nada), pero hay baseDelFoco: la
    // puerta mira desde el foco, no desde el turno. Mutar "ignorar baseDelFoco"
    // (volver a HEAD) daria null → este test muere.
    const conFoco = ctx(true, null, 'base-del-foco')
    expect(await ficheroAProbar(conFoco, project, analisis('ancla.sql', 'nueva.sql'), OBSOLETO)).toBe('nueva.sql')
  })
})
