import type { NewProject } from '@domain/project/project'
import { describe, expect, it } from 'vitest'
import type { Db } from './database'
import { createMemoryDb } from './memory-db'
import { createSqliteProjectRepository } from './sqlite-project-repository'

const PATH = '/tmp/fcc'

/** El renderer manda lo que quiere: NewProject es una promesa de compilacion. */
function nuevo(configState: unknown): NewProject {
  return {
    name: 'FCC',
    path: PATH,
    stack: 'node',
    gitRemote: null,
    gitBranch: null,
    hasClaude: false,
    configState
  } as NewProject
}

/** La columna cruda, sin pasar por toProject: la lectura normaliza y taparia el bug. */
function rawConfigState(db: Db): string {
  const row = db.prepare('SELECT config_state FROM projects WHERE path = ?').get(PATH) as {
    config_state: string
  }
  return row.config_state
}

describe('createSqliteProjectRepository.add', () => {
  it('un configState fuera del enum no llega a la columna', () => {
    const db = createMemoryDb()
    createSqliteProjectRepository(db).add(nuevo('DUENO_DEL_MUNDO'))
    expect(rawConfigState(db)).toBe('CONFIGURADO')
  })

  it('el valor legitimo PENDIENTE_CONFIGURACION sobrevive el viaje intacto', () => {
    const db = createMemoryDb()
    const project = createSqliteProjectRepository(db).add(nuevo('PENDIENTE_CONFIGURACION'))
    expect(rawConfigState(db)).toBe('PENDIENTE_CONFIGURACION')
    expect(project.configState).toBe('PENDIENTE_CONFIGURACION')
  })

  it('omitir el campo conserva el defecto documentado: CONFIGURADO', () => {
    const db = createMemoryDb()
    createSqliteProjectRepository(db).add(nuevo(undefined))
    expect(rawConfigState(db)).toBe('CONFIGURADO')
  })

  it('un valor no vinculable ya no revienta el INSERT', () => {
    const db = createMemoryDb()
    const repo = createSqliteProjectRepository(db)
    expect(() => repo.add(nuevo({ toString: () => 'CONFIGURADO' }))).not.toThrow()
    expect(rawConfigState(db)).toBe('CONFIGURADO')
  })
})
