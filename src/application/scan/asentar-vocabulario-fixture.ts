import type { NewOmegaEntry } from '@domain/omega/omega-entry'
import type { Project } from '@domain/project/project'
import type { DetectedFinding } from '@domain/scan/detected-finding'
import type { TipoDeDefecto } from '@domain/scan/tipo-de-defecto'
import type { AppContext } from '../context'

export const PROJECT = { id: 'p1', name: 'P' } as Project

/** Un contexto con el Libro en memoria; `rompe` lo hace fallar al escribir. */
export function contexto(rompe = false): { context: AppContext; asientos: NewOmegaEntry[] } {
  const asientos: NewOmegaEntry[] = []
  const append = (e: NewOmegaEntry): NewOmegaEntry => {
    if (rompe) throw new Error('el Libro no escribe')
    asientos.push(e)
    return e
  }
  return { context: { omegaLog: { append } } as unknown as AppContext, asientos }
}

// prettier-ignore
export const hallazgo = (tipo: TipoDeDefecto, file = 'f.ts', line: number | null = 1): DetectedFinding => ({
  severity: 'LOW', title: 't', file, line, tipo, simbolo: 'h'
})
