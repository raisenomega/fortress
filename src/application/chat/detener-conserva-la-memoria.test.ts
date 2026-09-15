import { describe, expect, it } from 'vitest'
import type { CodeAgentReply, CodeAgentRequest } from '@domain/chat/code-agent'
import { turno } from './turno-con-foco-fixture'

/*
 * Detener a mitad de un turno REANUDADO no borra la memoria del hallazgo
 * (ADR-088, Enmienda 2).
 *
 * Medido el 2026-09-15 con el CLI 2.1.272, reanudando una sesion real con
 * `--resume <id> --fork-session` y mandando la parada de Detener —SIGTERM al pid,
 * como `killChildrenOf`— tras 1 y tras 2 turnos completos: el CLI atrapa la senal
 * y sale solo con code 143 y signal null, SIN evento `result`. `collectRun` lo
 * deja fallido y sin sesion ni turnos, la misma forma que se tomaba por un
 * `--resume` roto: se olvidaba una sesion que seguia valida.
 */
const RESUELVE = { prompt: 'Resuelve este hallazgo', findingId: 'f-neutro' }
// Lo que deja el CLI parado por Detener: fallido y sin evento final.
const PARADO: Partial<CodeAgentReply> = { failed: true }
// Lo que contesta el CLI a una sesion que no existe: evento final con cero turnos.
const ROTO: Partial<CodeAgentReply> = { failed: true, turns: 0, sessionId: 'id-falso' }
const NUEVA: Partial<CodeAgentReply> = { sessionId: 'ses-nueva', turns: 2 }
const rotoAlReanudar = (p: CodeAgentRequest): Partial<CodeAgentReply> =>
  p.reanudarSesion ? ROTO : NUEVA

describe('(i) Detener a mitad de un turno reanudado valido: la memoria se CONSERVA', () => {
  it('autonomo: la red revierte, la sesion guardada sigue y no se relanza nada', async () => {
    const t = await turno(RESUELVE, { sesion: 'ses-1', detenido: true, respuesta: () => PARADO })

    expect(t.pedidos.map((p) => p.reanudarSesion)).toEqual(['ses-1'])
    expect([t.olvidadas, t.recordadas]).toEqual([[], []])
  })

  it('supervisado, sin red: tampoco se olvida ni avanza', async () => {
    const supervisado = { ...RESUELVE, mode: 'supervisado' as const }
    const t = await turno(supervisado, { sesion: 'ses-1', detenido: true, respuesta: () => PARADO })

    expect([t.olvidadas, t.recordadas]).toEqual([[], []])
  })
})

describe('(ii) el --resume roto de verdad: la memoria se LIMPIA, como ya pasaba', () => {
  it('sin Detener: se olvida, arranca de cero y se recuerda la nueva', async () => {
    const t = await turno(RESUELVE, { sesion: 'ses-borrada', respuesta: rotoAlReanudar })

    expect(t.olvidadas).toEqual(['f-neutro'])
    expect(t.recordadas).toEqual([{ id: 'f-neutro', sesion: 'ses-nueva' }])
  })

  it('con Detener: el CLI ya contesto el roto, asi que se olvida, pero no se relanza', async () => {
    // prettier-ignore
    const t = await turno(RESUELVE, { sesion: 'ses-borrada', detenido: true, respuesta: rotoAlReanudar })

    expect(t.pedidos).toHaveLength(1)
    expect([t.olvidadas, t.recordadas]).toEqual([['f-neutro'], []])
  })
})
