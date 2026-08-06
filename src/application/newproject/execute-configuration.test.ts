import { describe, expect, it } from 'vitest'
import { DRAFTED_DOCS } from '@domain/chat/config-docs'
import type { Project } from '@domain/project/project'
import { err, ok } from '@domain/shared/result'
import type { AppContext } from '../context'
import { executeConfiguration, type GovernanceWriter } from './execute-configuration'

const PROJECT = {
  id: 'p1',
  name: 'P',
  path: '/tmp/p',
  configState: 'PENDIENTE_CONFIGURACION'
} as Project

function ctx(): { context: AppContext; configured: string[] } {
  const configured: string[] = []
  const context = {
    projects: {
      findById: () => PROJECT,
      setConfigState: (_id: string, s: string) => configured.push(s)
    }
  } as unknown as AppContext
  return { context, configured }
}

function fullDrafts(): Record<string, string> {
  return Object.fromEntries(DRAFTED_DOCS.map((doc) => [doc, `contenido de ${doc}`]))
}

const okWriter: GovernanceWriter = { write: () => Promise.resolve(ok('escrito')) }

describe('executeConfiguration', () => {
  it('con los 7 docs: escribe y deja el proyecto CONFIGURADO', async () => {
    const { context, configured } = ctx()
    const r = await executeConfiguration(context, okWriter, 'p1', fullDrafts())
    expect(r.ok).toBe(true)
    expect(configured).toEqual(['CONFIGURADO'])
  })

  it('si falta un documento, no escribe ni configura', async () => {
    const { context, configured } = ctx()
    const drafts = fullDrafts()
    delete drafts['AGENTS.md']
    let wrote = false
    const writer: GovernanceWriter = { write: () => ((wrote = true), Promise.resolve(ok(''))) }
    const r = await executeConfiguration(context, writer, 'p1', drafts)
    expect(r.ok).toBe(false)
    expect(wrote).toBe(false)
    expect(configured).toHaveLength(0)
  })

  it('si la escritura falla, no marca CONFIGURADO', async () => {
    const { context, configured } = ctx()
    const writer: GovernanceWriter = { write: () => Promise.resolve(err('disco lleno')) }
    const r = await executeConfiguration(context, writer, 'p1', fullDrafts())
    expect(r.ok).toBe(false)
    expect(configured).toHaveLength(0)
  })

  it('rechaza si el proyecto ya esta CONFIGURADO (idempotencia)', async () => {
    const configured: string[] = []
    const done = { id: 'p1', name: 'P', path: '/tmp/p', configState: 'CONFIGURADO' } as Project
    const context = {
      projects: {
        findById: () => done,
        setConfigState: (_: string, s: string) => configured.push(s)
      }
    } as unknown as AppContext
    const r = await executeConfiguration(context, okWriter, 'p1', fullDrafts())
    expect(r.ok).toBe(false)
    expect(configured).toHaveLength(0)
  })
})
