import { describe, expect, it } from 'vitest'
import type { CodeAgentReply } from '@domain/chat/code-agent'
import { turno } from './turno-con-foco-fixture'

const RESUELVE = { prompt: 'Resuelve este hallazgo', findingId: 'f-neutro' }
const NUEVA = (): Partial<CodeAgentReply> => ({ sessionId: 'ses-2', turns: 3 })

describe('la memoria del productor viaja de un turno al siguiente (ADR-088, Enmienda 2)', () => {
  it('turno 1 con foco: arranca sin memoria y guarda la sesion del CLI', async () => {
    const t = await turno(RESUELVE, { respuesta: () => ({ sessionId: 'ses-1', turns: 2 }) })

    expect(t.pedidos[0].reanudarSesion).toBeUndefined()
    expect(t.recordadas).toEqual([{ id: 'f-neutro', sesion: 'ses-1' }])
  })

  it('turno 2 con ese foco: la reanuda', async () => {
    const t = await turno(RESUELVE, { sesion: 'ses-1', respuesta: NUEVA })

    expect(t.pedidos[0].reanudarSesion).toBe('ses-1')
    expect(t.recordadas).toEqual([{ id: 'f-neutro', sesion: 'ses-2' }])
  })

  it('sin foco no hay memoria: ni se reanuda ni se guarda', async () => {
    const t = await turno({ prompt: 'hola' }, { sesion: 'ses-1', respuesta: NUEVA })

    expect(t.pedidos.every((p) => p.reanudarSesion === undefined)).toBe(true)
    expect(t.recordadas).toEqual([])
  })
})

describe('GARANTIA 1, de punta a punta: solo la red que REVIRTIO frena la memoria', () => {
  it('(i) autonomo y el turno falla: la red revierte y la sesion NO avanza', async () => {
    const t = await turno(RESUELVE, { sesion: 'ses-1', respuesta: () => ({ ...NUEVA(), failed: true }) }) // prettier-ignore

    expect(t.recordadas).toEqual([])
  })

  it('(ii) autonomo y verde: la red conserva y la sesion avanza', async () => {
    const t = await turno(RESUELVE, { sesion: 'ses-1', respuesta: NUEVA })

    expect(t.recordadas).toEqual([{ id: 'f-neutro', sesion: 'ses-2' }])
  })

  it('(iii) «propon» en supervisado, sin red: la sesion avanza igual', async () => {
    const t = await turno({ ...RESUELVE, mode: 'supervisado' }, { sesion: 'ses-1', respuesta: NUEVA }) // prettier-ignore

    expect(t.recordadas).toEqual([{ id: 'f-neutro', sesion: 'ses-2' }])
  })
})

describe('GARANTIA 2, de punta a punta: una memoria rota nunca bloquea resolver', () => {
  it('--resume roto: se olvida, el turno arranca de cero y responde', async () => {
    // Lo que contesta de verdad el CLI a una sesion que no existe.
    const roto = { failed: true, turns: 0, sessionId: 'id-falso' }
    const t = await turno(RESUELVE, {
      sesion: 'ses-borrada',
      respuesta: (p) => (p.reanudarSesion ? roto : { sessionId: 'ses-nueva', turns: 2 })
    })

    expect(t.r.ok).toBe(true)
    expect(t.pedidos.map((p) => p.reanudarSesion)).toEqual(['ses-borrada', undefined])
    expect(t.olvidadas).toEqual(['f-neutro'])
    expect(t.recordadas).toEqual([{ id: 'f-neutro', sesion: 'ses-nueva' }])
  })
})
