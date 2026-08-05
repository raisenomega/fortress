import { describe, expect, it } from 'vitest'
import type { Project } from '@domain/project/project'
import type { AppContext } from '../context'
import { persistQuality } from './persist-quality'

describe('persistQuality', () => {
  it('calcula la calidad general (todas las dimensiones) y la persiste', () => {
    let saved: number | null = null
    const context = {
      projects: {
        setGeneralQuality: (_id: string, score: number): void => {
          saved = score
        }
      }
    } as unknown as AppContext
    const project = { id: 'p1' } as Project

    const result = persistQuality(context, project, [
      { severity: 'HIGH', title: 't', file: 'a.ts', line: 1 },
      { severity: 'LOW', title: 'u', file: 'b.ts', line: 2 }
    ])

    expect(result).toBe(91) // 100 - 8 - 1
    expect(saved).toBe(91)
  })
})
