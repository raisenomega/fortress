import { describe, expect, it } from 'vitest'
import type { Assistant } from '@domain/chat/assistant'
import type { CodeAgent } from '@domain/chat/code-agent'
import type { Project } from '@domain/project/project'
import { chooseEngine } from './choose-engine'

const PROJECT = { id: 'p1', name: 'P', path: '/tmp/p', trusted: false } as Project

function codeAgent(available: boolean, precheck: string | null = null): CodeAgent {
  return {
    isAvailable: () => available,
    precheck: () => precheck,
    run: () => Promise.reject(new Error('no debe correr en esta prueba'))
  }
}

const assistant = { stream: () => Promise.reject(new Error('no')) } as Assistant

describe('chooseEngine', () => {
  it('con el CLI disponible y sin problemas usa claude-code', () => {
    const r = chooseEngine(codeAgent(true), null, PROJECT)
    expect(r.ok && r.value).toBe('claude-code')
  })

  it('con el CLI disponible pero precheck en rojo, propaga el problema', () => {
    const r = chooseEngine(codeAgent(true, 'falta git'), assistant, PROJECT)
    expect(r.ok).toBe(false)
    expect(!r.ok && r.error).toBe('falta git')
  })

  it('sin CLI pero con API cae a solo texto', () => {
    const r = chooseEngine(codeAgent(false), assistant, PROJECT)
    expect(r.ok && r.value).toBe('api')
  })

  it('sin CLI ni API no hay forma de responder', () => {
    expect(chooseEngine(codeAgent(false), null, PROJECT).ok).toBe(false)
  })
})
